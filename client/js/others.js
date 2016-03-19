(function () {
var app = angular.module("todos", ['ngDialog']);
var socket = io.connect('http://172.16.2.26:3000');
socket.on('user.add', function (data) {
    console.log('user.add', data);
});
app.controller("todoCtrl", ["$scope", "$http", "ngDialog", "$q",
        function ($scope, $http, ngDialog, $q) {
    function fetchTodos() {
        $http.get('/gift').success(function (res) {
            $scope.todos = res;
            console.log($scope.todos);
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
        if (!todo.userId) {
            todo.userId = $scope.userId;
        } else {
            todo.userId = '';
        }
        return $http.put('/gift' + '/' + todo._id, todo).then(function (data) {
            socket.emit('client.update', todo);
            return $q.when(data);
        });
    }

    function updateInfo(info) {
        console.log('put info', info);
        return $http.put('/info/dreamfox', info);
    }

    $scope.save = function ($event) {
        if ($event.keyCode !== 13 || !$scope.inputVal) {
            return;
        }
        $http.post('/gift', {
            label: $scope.inputVal,
            checked: false
        }).success(function (todo) {
            $scope.todos.push({
                _id: todo._id,
                label: $scope.inputVal,
                checked: false
            });
            socket.emit('client.add', {
                _id: todo._id,
                label: $scope.inputVal,
                checked: false
            });
            $scope.inputVal = '';
        });
    };
    socket.on('server.add', function (todo) {
        console.log('add:', todo);
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

    $scope.give = function (todo) {
        ngDialog.openConfirm({
            template: 'donorDialog',
            scope: $scope,
            appendClassName: 'donor-dialog',
            controller: ['$scope', function ($scope) {
                $scope.submit = function () {
                    if (todo.checked) {
                        ngDialog.open({
                            template: '<p class="hint">抱歉，已经被人抢先领取</p>',
                            plain: true
                        });
                        $scope.closeThisDialog();
                        return;
                    }
                    todo.donor = $scope.donorName;
                    console.log(todo.donor);
                    todo.checked = true;
                    updateTodo(todo).then(function () {
                        $scope.confirm($scope.donorName);
                    });
                };
            }]
        }).then(function (name) {
            $scope.donorName = name;
            localStorage.setItem('donorName', name);
            ngDialog.open({
                template: '<p class="hint">页面底部可以看到DreamFox的收货地址喔</p>',
                plain: true
            });
        });
    };

    $scope.giveUp = function (todo) {
        todo.checked = false;
        todo.donor = '';
        updateTodo(todo).then(function () {
            ngDialog.open({
                template: '<p class="hint">您已经放弃认领该心愿，欢迎认领其他心愿</p>',
                plain: true
            });
        })
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

    $scope.logOpen = function (name) {
        socket.emit('client.openlink', name);
    };

    $scope.info = {};
    $scope.todos = [];
    $scope.donorName = localStorage.getItem('donorName') || '';
    $scope.userId = localStorage.getItem('userId');
    if (!$scope.userId) {
        $scope.userId = String(Date.now() + Math.random());
        localStorage.setItem('userId', $scope.userId);
    }
    $scope.doneNum = 0;
    fetchInfo();
    fetchTodos();
    socket.on('server.change', fetchTodos);

    socket.on('server.openlink', function (name) {
        console.log(name);
    });
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