const { createHash } = require('crypto');
const {
    CONTENT_TYPE
} = require('../../../shared/constants/content-type.constant');

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

const createLegacyViewSessionId = historyId => {
    const bytes = Buffer.from(
        createHash('sha256')
            .update(`streamflix-watch-history:${historyId}`)
            .digest()
            .subarray(0, 16)
    );

    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString('hex');
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20)
    ].join('-');
};

const normalizeViewSessionId = viewSessionId => {
    const normalized = typeof viewSessionId === 'string' ?
        viewSessionId.trim().toLowerCase() :
        '';

    return UUID_PATTERN.test(normalized) ? normalized : '';
};

const createViewKey = (profileId, contentId, viewSessionId) => [
    profileId.toString(),
    contentId.toString(),
    viewSessionId
].join(':');

const isWithinPeriod = (value, period) => {
    const timestamp = new Date(value).getTime();

    if (!Number.isFinite(timestamp)) {
        return false;
    }

    if (!period) {
        return true;
    }

    return timestamp >= period.startDate.getTime() &&
        timestamp < period.endDate.getTime();
};

const getContent = history => {
    if (
        !history ||
        !history.contentId ||
        !history.contentId._id
    ) {
        return null;
    }

    if (
        history.contentId.type !== CONTENT_TYPE.MOVIE &&
        history.contentId.type !== CONTENT_TYPE.SERIES
    ) {
        return null;
    }

    return history.contentId;
};

const getHistoryEvents = (history, period = null) => {
    const timestampedEvents = Array.isArray(history.viewEvents) ?
        history.viewEvents :
        [];
    const eventsBySession = new Map();
    const timestampedSessionIds = new Set();

    for (const event of timestampedEvents) {
        const viewSessionId = normalizeViewSessionId(
            event && event.viewSessionId
        );

        if (!viewSessionId) {
            continue;
        }

        timestampedSessionIds.add(viewSessionId);

        if (!isWithinPeriod(event && event.viewedAt, period)) {
            continue;
        }

        const viewedAt = new Date(event.viewedAt);
        const existingEvent = eventsBySession.get(viewSessionId);

        if (
            !existingEvent ||
            viewedAt.getTime() < existingEvent.viewedAt.getTime()
        ) {
            eventsBySession.set(viewSessionId, {
                viewSessionId,
                viewedAt
            });
        }
    }

    const fallbackViewedAt = history.createdAt || history.watchedAt;
    const knownSessionIds = [
        ...(Array.isArray(history.viewSessionIds) ?
            history.viewSessionIds :
            []),
        history.viewSessionId
    ]
        .map(normalizeViewSessionId)
        .filter(Boolean);
    const uniqueSessionIds = [...new Set(knownSessionIds)];

    if (isWithinPeriod(fallbackViewedAt, period)) {
        const legacySessionIds = uniqueSessionIds.length > 0 ?
            uniqueSessionIds :
            [createLegacyViewSessionId(history._id)];

        for (const viewSessionId of legacySessionIds) {
            if (
                timestampedSessionIds.has(viewSessionId) ||
                eventsBySession.has(viewSessionId)
            ) {
                continue;
            }

            eventsBySession.set(viewSessionId, {
                viewSessionId,
                viewedAt: new Date(fallbackViewedAt)
            });
        }
    }

    return [...eventsBySession.values()].sort((left, right) => {
        const timeDifference =
            left.viewedAt.getTime() - right.viewedAt.getTime();

        return timeDifference ||
            left.viewSessionId.localeCompare(right.viewSessionId);
    });
};

const resolveAlias = (viewKey, aliases) => {
    let resolved = viewKey;
    const visited = new Set();

    while (aliases.has(resolved) && !visited.has(resolved)) {
        visited.add(resolved);
        resolved = aliases.get(resolved);
    }

    return resolved;
};

const normalizeStoredViewKey = (viewKey, aliases) => {
    const parts = String(viewKey).split(':');

    if (parts.length !== 3) {
        return String(viewKey);
    }

    const [profileId, contentId, storedSessionId] = parts;
    const normalizedSessionId =
        normalizeViewSessionId(storedSessionId) ||
        (
            OBJECT_ID_PATTERN.test(storedSessionId) ?
                createLegacyViewSessionId(storedSessionId.toLowerCase()) :
                storedSessionId
        );
    const normalizedKey = createViewKey(
        profileId,
        contentId,
        normalizedSessionId
    );

    return resolveAlias(normalizedKey, aliases);
};

const hasLegacyRawViewKeys = usage => [
    ...(usage && usage.movieViewKeys || []),
    ...(usage && usage.seriesViewKeys || [])
].some(viewKey => {
    const parts = String(viewKey).split(':');

    return parts.length === 3 && OBJECT_ID_PATTERN.test(parts[2]);
});

const normalizeExistingUsage = (
    viewKeys,
    usedCount,
    aliases
) => {
    const originalKeys = [...new Set((viewKeys || []).map(String))];
    const normalizedKeys = new Set(
        originalKeys.map(viewKey =>
            normalizeStoredViewKey(viewKey, aliases)
        )
    );
    const normalizedUsedCount = Number.isInteger(usedCount) &&
        usedCount >= 0 ?
        usedCount :
        0;
    const knownDuplicateCount =
        originalKeys.length - normalizedKeys.size;

    return {
        keys: normalizedKeys,
        usedCount: Math.max(
            normalizedKeys.size,
            normalizedUsedCount - knownDuplicateCount
        )
    };
};

const buildUsageBackfill = (
    subscription,
    existingUsage,
    histories,
    period = {
        startDate: new Date(subscription.startDate),
        endDate: new Date(subscription.endDate)
    },
    durableEvents = []
) => {
    const currentUsage = existingUsage &&
        existingUsage.periodStart &&
        existingUsage.periodEnd &&
        new Date(existingUsage.periodStart).getTime() ===
            period.startDate.getTime() &&
        new Date(existingUsage.periodEnd).getTime() ===
            period.endDate.getTime() ?
        existingUsage :
        null;
    const historyEvents = [];
    const aliases = new Map();

    for (const history of histories) {
        const content = getContent(history);

        if (!content) {
            continue;
        }

        const events = getHistoryEvents(history, period);

        for (const event of events) {
            historyEvents.push({
                type: content.type,
                viewKey: createViewKey(
                    history.profileId,
                    content._id,
                    event.viewSessionId
                )
            });
        }

        if (events.length === 0) {
            continue;
        }

        const canonicalViewKey = createViewKey(
            history.profileId,
            content._id,
            events[0].viewSessionId
        );
        const rawLegacyViewKey = createViewKey(
            history.profileId,
            content._id,
            history._id.toString()
        );
        const derivedLegacyViewKey = createViewKey(
            history.profileId,
            content._id,
            createLegacyViewSessionId(history._id)
        );

        aliases.set(rawLegacyViewKey, canonicalViewKey);
        aliases.set(derivedLegacyViewKey, canonicalViewKey);
    }

    for (const event of durableEvents) {
        const viewSessionId = normalizeViewSessionId(
            event && event.viewSessionId
        );
        const profileId = event && event.profileId;
        const contentId = event && event.contentId;
        const contentType = event && event.contentType;

        if (
            !viewSessionId ||
            !profileId ||
            !contentId ||
            !isWithinPeriod(event.viewedAt, period) ||
            (
                contentType !== CONTENT_TYPE.MOVIE &&
                contentType !== CONTENT_TYPE.SERIES
            )
        ) {
            continue;
        }

        historyEvents.push({
            type: contentType,
            viewKey: createViewKey(
                profileId,
                contentId,
                viewSessionId
            )
        });
    }

    const normalizedMovies = normalizeExistingUsage(
        currentUsage && currentUsage.movieViewKeys,
        currentUsage && currentUsage.moviesUsedCount,
        aliases
    );
    const normalizedSeries = normalizeExistingUsage(
        currentUsage && currentUsage.seriesViewKeys,
        currentUsage && currentUsage.seriesUsedCount,
        aliases
    );

    for (const event of historyEvents) {
        if (event.type === CONTENT_TYPE.MOVIE) {
            normalizedMovies.keys.add(event.viewKey);
        } else {
            normalizedSeries.keys.add(event.viewKey);
        }
    }

    const movieViewKeys = [...normalizedMovies.keys].sort();
    const seriesViewKeys = [...normalizedSeries.keys].sort();

    return {
        userId: subscription.userId,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        moviesUsedCount: Math.max(
            normalizedMovies.usedCount,
            movieViewKeys.length
        ),
        seriesUsedCount: Math.max(
            normalizedSeries.usedCount,
            seriesViewKeys.length
        ),
        movieViewKeys,
        seriesViewKeys
    };
};

const createUsageHistoryFilter = (profileIds, period) => ({
    profileId: {
        $in: profileIds
    },
    $or: [
        {
            createdAt: {
                $gte: period.startDate,
                $lt: period.endDate
            }
        },
        {
            'viewEvents.viewedAt': {
                $gte: period.startDate,
                $lt: period.endDate
            }
        },
        {
            createdAt: {
                $exists: false
            },
            watchedAt: {
                $gte: period.startDate,
                $lt: period.endDate
            }
        }
    ]
});

module.exports = {
    UUID_PATTERN,
    buildUsageBackfill,
    createLegacyViewSessionId,
    createUsageHistoryFilter,
    createViewKey,
    getHistoryEvents,
    hasLegacyRawViewKeys,
    normalizeStoredViewKey,
    normalizeViewSessionId
};
