/*
 * Copyright (c) 2014 DataTorrent, Inc. ALL Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

angular.module('ui.dashboard')
  .directive('dashboardLayouts', ['LayoutStorage', '$timeout', '$uibModal',
    function(LayoutStorage, $timeout, $uibModal) {
      return {
        scope: true,
        templateUrl: function(element, attr) {
          return attr.templateUrl ? attr.templateUrl : 'components/directives/dashboardLayouts/dashboardLayouts.html';
        },
        link: function(scope, element, attrs) {

          scope.options = scope.$eval(attrs.dashboardLayouts);

          var layoutStorage = new LayoutStorage(scope.options);

          scope.layouts = layoutStorage.layouts;

          scope.createNewLayout = function() {
            var newLayout = {
              title: 'Custom',
              defaultWidgets: scope.options.defaultWidgets || []
            };
            layoutStorage.add(newLayout);
            scope.makeLayoutActive(newLayout);
            layoutStorage.save();
            return newLayout;
          };

          scope.removeLayout = function(layout) {
            layoutStorage.remove(layout);
            layoutStorage.save();
          };

          scope.makeLayoutActive = function(layout) {

            var current = layoutStorage.getActiveLayout();

            if (current && current.dashboard.unsavedChangeCount) {
              var modalInstance = $uibModal.open({
                templateUrl: 'template/SaveChangesModal.html',
                resolve: {
                  layout: function() {
                    return layout;
                  }
                },
                controller: 'SaveChangesModalCtrl'
              });

              // Set resolve and reject callbacks for the result promise
              modalInstance.result.then(
                function() {
                  current.dashboard.saveDashboard();
                  scope._makeLayoutActive(layout);
                },
                function() {
                  scope._makeLayoutActive(layout);
                }
              );
            } else {
              scope._makeLayoutActive(layout);
            }

          };

          scope._makeLayoutActive = function(layout) {
            angular.forEach(scope.layouts, function(l) {
              if (l !== layout) {
                l.active = false;
              } else {
                l.active = true;
              }
            });
            layoutStorage.save();
          };

          scope.isActive = function(layout) {
            return !!layout.active;
          };

          scope.editTitle = function(layout) {
            if (layout.locked) {
              return;
            }

            var input = element.find('input[data-layout="' + layout.id + '"]');
            layout.editingTitle = true;

            $timeout(function() {
              input.focus()[0].setSelectionRange(0, 9999);
            });
          };

          // saves whatever is in the title input as the new title
          scope.saveTitleEdit = function(layout, event) {
            layout.editingTitle = false;
            layoutStorage.save();

            // When a browser is open and the user clicks on the tab title to change it,
            // upon pressing the Enter key, the page refreshes.
            // This statement prevents that.
            var evt = event || window.event;
            if (evt) {
              evt.preventDefault();
            }
          };

          scope.titleLostFocus = function(layout, event) {
            // user clicked some where; now we lost focus to the input box
            // lets see if we need to save the title
            if (layout && layout.editingTitle) {
              if (layout.title !== '') {
                scope.saveTitleEdit(layout, event);
              } else {
                // can't save blank title
                var input = element.find('input[data-layout="' + layout.id + '"]');
                $timeout(function() {
                  input.focus();
                });
              }
            }
          };

          scope.options.saveLayouts = function() {
            layoutStorage.save(true);
          };
          scope.options.addWidget = function() {
            var layout = layoutStorage.getActiveLayout();
            if (layout) {
              layout.dashboard.addWidget.apply(layout.dashboard, arguments);
            }
          };
          scope.options.prependWidget = function() {
            var layout = layoutStorage.getActiveLayout();
            if (layout) {
              layout.dashboard.prependWidget.apply(layout.dashboard, arguments);
            }
          };
          scope.options.loadWidgets = function() {
            var layout = layoutStorage.getActiveLayout();
            if (layout) {
              layout.dashboard.loadWidgets.apply(layout.dashboard, arguments);
            }
          };
          scope.options.saveDashboard = function() {
            var layout = layoutStorage.getActiveLayout();
            if (layout) {
              layout.dashboard.saveDashboard.apply(layout.dashboard, arguments);
            }
          };

          var sortableDefaults = {
            stop: function() {
              scope.options.saveLayouts();
            },
            distance: 5
          };
          scope.sortableOptions = angular.extend({}, sortableDefaults, scope.options.sortableOptions || {});
        }
      };
    }
  ]);