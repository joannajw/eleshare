var app = angular.module('eleshare', ['ui.router']);
// var util = require('./util'); 

// TODO: do this a better way
gCategories = [
          'Technology', 
          'Travel', 
          'Science', 
          'Art', 
          'News'
        ]

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('home', {
                url: '/home',
                templateUrl: '/home.html',
                controller: 'MainCtrl',
                resolve: {
                    postPromise: ['posts', function(posts){
                        return posts.getAll();
                    }]
                }
            })

            .state('posts', {
                url: '/posts/{id}',
                templateUrl: '/posts.html',
                controller: 'PostsCtrl',
                resolve: {
                  post: ['$stateParams', 'posts', function($stateParams, posts) {
                    console.log("post: ", posts.get($stateParams.id));
                    return posts.get($stateParams.id);
                  }]
                }
            })

            .state('login', {
              url: '/login',
              templateUrl: '/login.html',
              controller: 'AuthCtrl',
              onEnter: ['$state', 'auth', function($state, auth){
                if(auth.isLoggedIn()){
                  $state.go('home');
                }
              }]
            })

            .state('register', {
              url: '/register',
              templateUrl: '/register.html',
              controller: 'AuthCtrl',
              onEnter: ['$state', 'auth', function($state, auth){
                if(auth.isLoggedIn()){
                  $state.go('home');
                }
              }]
            })

            .state('users', {
                url: '/users/{username}',
                templateUrl: '/users.html',
                controller: 'UserProfilesCtrl',
                resolve: {
                  user: ['$stateParams', 'users', function($stateParams, users) {
                    console.log("user: ", users.getUser($stateParams.username));
                    return users.getUser($stateParams.username);
                  }]
                }
            });

        $urlRouterProvider.otherwise('home');
}]);

// service 
app.factory('posts', ['$http', 'auth', 'users', function($http, auth, users) {

  var o = {
    posts: []
  };

  o.getAll = function() {
    username = auth.currentUser(); 

    filteredPosts = []; 

    // get user categories 
    $http.get('/users/' + username + '/categories').success(function(data) {
      //console.log("user categories: ", data); 

      categoriesStr = ""; 

      for (i in data) {
        categoriesStr += data[i]
        if (i < data.length - 1) categoriesStr += '|'; 
      }

      $http.get('/posts/category/' + categoriesStr).success(function(data){
        angular.copy(data, o.posts);
        // filteredPosts = filteredPosts.concat(data); 
        // angular.copy(filteredPosts, o.posts);
      });
  
    });

  filteredPosts = filteredPosts.filter(function(elem, pos) {
    return filteredPosts.indexOf(elem) == pos;
  }); 
  // angular.copy(filteredPosts, o.posts);

  };

  o.create = function(post) {
    return $http.post('/posts', post, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };

  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    })
      .success(function(data){
        post.upvotes += 1;
      });
  };

  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res){
      return res.data;
    });
  };

  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    });
  };

  o.upvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
      headers: {Authorization: 'Bearer ' + auth.getToken()}
    })
      .success(function(data){
        comment.upvotes += 1;
      });
  };

  return o; 

}]);

// controller 
app.controller('MainCtrl', [
'$scope', 'posts', 'auth',
function($scope, posts, auth){
    // $scope.test = 'Hello world!';
    $scope.isLoggedIn = auth.isLoggedIn; 
    $scope.posts = posts.posts; 
    $scope.categories = [
          'Technology', 
          'Travel', 
          'Science', 
          'Art', 
          'News'
        ]

    // $scope.checkedCategories = []; 

    $scope.addPost = function() {
      if (!$scope.title || $scope.title === '' || !$scope.checkedCategories) { return; }

      console.log($scope.checkedCategories);

      var postCategories = []; 
      for (var category in $scope.checkedCategories) {
        if ($scope.checkedCategories[category]) {
            postCategories.push(category);
        }
      }

      
      posts.create({
        title: $scope.title,
        link: $scope.link,
        categories: postCategories
      });
      $scope.title = ''; 
      $scope.link = ''; 
    };
    $scope.incrementUpvotes = function(post) {
      posts.upvote(post); 
    }


}]);

app.controller('PostsCtrl', [
    '$scope',
    'posts',
    'post',
    'auth', 
    function($scope, posts, post, auth){
        $scope.isLoggedIn = auth.isLoggedIn; 
        $scope.post = post; 
        $scope.categories = gCategories;

        $scope.addComment = function() {
            if ($scope.body === '') { return; }
            posts.addComment(post._id, {
              body: $scope.body,
              author: 'user',
            }).success(function(comment) {
              $scope.post.comments.push(comment);
            });
            $scope.body = '';
        }

        $scope.incrementUpvotes = function(comment){
          posts.upvoteComment(post, comment);
        };
    }
]);

app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};

    auth.saveToken = function (token){
      $window.localStorage['flapper-news-token'] = token;
    };

    auth.getToken = function (){
      return $window.localStorage['flapper-news-token'];
    }

    auth.isLoggedIn = function(){
      var token = auth.getToken();

      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    };

    auth.currentUser = function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.username;
      }
    };

    auth.register = function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logIn = function(user){
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logOut = function(){
      $window.localStorage.removeItem('flapper-news-token');
    };

  return auth;

}])

app.controller('AuthCtrl', [
    '$scope',
    '$state',
    'auth',
    function($scope, $state, auth){
        $scope.user = {};

        $scope.categories = [
          'Technology', 
          'Travel', 
          'Science', 
          'Art', 
          'News'
        ]


        $scope.register = function(){
            console.log("AuthCtrl user: ", $scope.user); 
            auth.register($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };

        $scope.logIn = function(){
            auth.logIn($scope.user).error(function(error){
                $scope.error = error;
            }).then(function(){
                $state.go('home');
            });
        };
    }
])

// service 
app.factory('users', ['$http', 'auth', function($http, auth) {

  var o = {};

  o.getUser = function(id) {
    return $http.get('/users/' + id).then(function(res){
      return res.data; 
      // console.log("data", data);
    });
  };

  return o; 

}]);

app.controller('UserProfilesCtrl', [
    '$scope',
    'users',
    'user', 
    function($scope, users, user) {
        // $scope.isLoggedIn = auth.isLoggedIn; 
        $scope.user = user;
        // console.log(users);  
    }
]);

app.controller('NavCtrl', [
  '$scope',
  'auth',
  function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
}]);

