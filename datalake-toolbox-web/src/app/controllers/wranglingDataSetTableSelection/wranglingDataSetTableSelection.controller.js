require('./wranglingDataSetTableSelection.css');

module.exports = {
  controller: WranglingDataSetTableSelectionController,
  controllerAs: 'wranglingDataSetTableSelection',
  template: require('./wranglingDataSetTableSelection.html')
};

/** @ngInject */
function WranglingDataSetTableSelectionController($timeout, $log, $location, $filter, $state, wranglingDataSetService, hiveService) {
  var vm = this;
  vm.sourceFilter = '';

  vm.selectTable = function(database, table) {
    var selectedTable = $filter('filter')(vm.tables, {database: database, table: table})[0];

    wranglingDataSetService.addTable(selectedTable);
    $state.go('wranglingDataSet');
  };

  vm.tables = [];

  activate();

  function activate() {
    hiveService.getTables().then(function(tables) {
      vm.tables = tables;
    });
  }
}