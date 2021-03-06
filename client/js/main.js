(function () {
var app = angular.module("todos", ['ngDialog']);
var socket = io.connect('http://localhost:3000');

app.controller("todoCtrl", ["$scope", "$http", "ngDialog",
        function ($scope, $http, ngDialog) {
    var that = this;
    function fetchTodos() {
        $http.get('/gift').success(function (res) {
            $scope.todos = res;
        });
    }
    function fetchInfo() {
        $http.get('/info/dreamfox').success(function (res) {
            console.log(res);
            $scope.info = res;
        });
    }

    function removeTodo(todo) {
        return $http.delete('/gift' + '/' + todo._id);
    }

    function updateTodo(todo) {
        if (todo.checked) {
            todo.donor = 'DreamFox';
        } else {
            todo.userId = '';
            todo.donor = '';
        }
        socket.emit('client.update', todo);
        return $http.put('/gift' + '/' + todo._id, todo);
    }

    function updateInfo(info) {
        console.log('put info', info);
        return $http.put('/info/dreamfox', info);
    }

    $scope.save = function ($event, inputVal) {
        if ($event.keyCode !== 13 || !inputVal) {
            return;
        }
        $http.post('/gift', {
            label: inputVal,
            checked: false
        }).success(function (todo) {
            $scope.todos.push({
                _id: todo._id,
                label: inputVal,
                checked: false
            });
            socket.emit('client.add', {
                _id: todo._id,
                label: inputVal,
                checked: false
            });
            that.inputVal = '';
        });
    };
    socket.on('server.add', function (todo) {
        console.log(todo);
        $scope.todos.push(todo);
        $scope.$apply();
    });
    socket.on('server.remove', function (todo) {
        console.log(todo);
        $scope.todos = _.reject($scope.todos, function (one) {
            return one._id === todo._id;
        });
        $scope.$apply();
    });
    socket.on('server.update', function (todo) {
        console.log('update');
        _.each($scope.todos, function (one) {
            if (one._id === todo._id) {
                angular.extend(one, todo);
                console.log(one);
            }
        });
        $scope.$apply();
    });

    $scope.destroy = function (todo) {
        removeTodo(todo).then(function () {
            socket.emit('client.remove', todo);
            $scope.todos = _.without($scope.todos, todo);
        });
    };

    $scope.toggle = function (todo) {
        updateTodo(todo);
    };

    $scope.toggleAll = function (checked) {
        checked = !checked;
        $http.put('/gift', {checked : checked}).then(function () {
            for (var i = 0, len = $scope.todos.length; i < len; i++) {
                $scope.todos[i].checked = checked;
            }
        });
    };

    $scope.countDone = function () {
        $scope.doneNum = _.filter($scope.todos, function(todo) {
            return todo.checked === true;
        }).length;
        if ($scope.doneNum === $scope.todos.length) {
            $scope.markAll = true;
        } else {
            $scope.markAll = false;
        }
        return $scope.doneNum;
    };

    $scope.removeDone = function () {
        $http.delete('/gift', {params: {checked : true}}).then(function () {
            $scope.todos = _.filter($scope.todos, function(todo) {
                return todo.checked !== true;
            });
        });
    };

    $scope.updateLabel = function($event, todo) {
        if ($event.keyCode !== 13 &&
                $event.type !== 'blur') {
            return;
        }
        updateTodo(todo).then(function () {
            todo.edit = false;
        });
    };

    $scope.addLink = function (todo) {
        ngDialog.open({
            template: 'linkDialog',
            appendClassName: 'link-dialog',
            controller: ['$scope', function ($scope) {
                $scope.linkAdd = todo.link;
                $scope.submit = function () {
                    todo.link = $scope.linkAdd;
                    console.log($scope.linkAdd);
                    updateTodo(todo).then(function () {
                        $scope.closeThisDialog();
                    });
                };
            }]
        })
    };

    $scope.editInfo = function (info) {
        ngDialog.open({
            template: 'infoDialog',
            appendClassName: 'link-dialog',
            controller: ['$scope', function ($scope) {
                $scope.info = info;
                $scope.submit = function () {
                    console.log(info);
                    updateInfo(info).then(function () {
                        $scope.closeThisDialog();
                    });
                };
            }]
        })
    };

    function login() {
        ngDialog.openConfirm({
            template: 'loginDialog',
            appendClassName: 'login-dialog',
            controller: ['$scope', function ($scope) {
                $scope.submit = function () {
                    $http.post('/login', {
                        user: $scope.user,
                        pass: $scope.pass
                    }).then(function () {
                        $scope.confirm();
                    }).catch(function () {
                        $scope.closeThisDialog();
                    })
                };
            }]
        }).then(function () {
            $scope.logined = true;
            $scope.info = {};
            $scope.todos = [];
            $scope.doneNum = 0;
            fetchInfo();
            fetchTodos();
        }).catch(function () {
            ngDialog.open({
                template: '<p class="hint">帐号密码错误</p>',
                plain: true
            }).closePromise.then(function () {
                login();
            });
        })
    }
    login();
}]);
app.config(['$httpProvider', 'ngDialogProvider', function ($httpProvider, ngDialogProvider) {
    ngDialogProvider.setDefaults({
        className: 'ngdialog-theme-default'
    });
    $httpProvider.interceptors.push((function () {
        var interceptor = function ($timeout, $q) {
            return {
                'response' : function (opt) {
                    return opt;
                }
            };
        };
        interceptor.$inject = ['$timeout', '$q'];
        return interceptor;
    }()));
}]);
app.directive('autoFocus', function () {
    return {
        link : function (scope, el) {
            scope.$watch('todo.edit', function (edit) {
                console.log(edit);
                if (edit === false) {
                    return;
                }
                setTimeout(function () {
                    el[0].focus();
                }, 75);
            })
        }
    }
});
})();