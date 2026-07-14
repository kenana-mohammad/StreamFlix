const User = require('../../users/models/User');
const Movie = require('../../content/models/Movie');
const Series = require('../../content/models/Series')
const Season = require('../../content/models/Season');
const Episode = require('../../content/models/Episode');
const Plan = require('../../plans/models/Plan');


class DashboardService {
    
     getStats = async () => {
       const userCount = await User.countDocuments();
       const activeUsersCount = await User.countDocuments();
       const seriesCount = await Series.countDocuments();
       const movieCount = await Movie.countDocuments();
       const seasonCount = await Season.countDocuments();
       const episodeCount = await Episode.countDocuments();
       const planCount = await Plan.countDocuments();
       
       return {
               users: userCount,
               activeUsers : activeUsersCount,
               series: seriesCount,
               movies: movieCount,
               seasons: seasonCount,
               episodes: episodeCount,
               plans: planCount
       }
   }
   
  

  

   
}

module.exports = new DashboardService();

