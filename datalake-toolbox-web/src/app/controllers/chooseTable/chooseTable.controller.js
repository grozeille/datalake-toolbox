require('./chooseTable.css');

module.exports = {
  controller: ChooseTableController,
  controllerAs: 'chooseTable',
  template: require('./chooseTable.html')
};


/** @ngInject */
function ChooseTableController($timeout, $log, $location, $filter, $sce, preparationService, hiveService) {
  var vm = this;
  vm.sourceFilter = "";

  vm.selectTable = function(database, table){
    var selectedTable = $filter('filter')(vm.tables, { database: database, table: table })[0];

    preparationService.addTable(selectedTable);
    $location.path( "/editor" );
  };

  vm.tables = [];


  activate();

  function activate(){
    hiveService.getTables().then(function(tables){
      vm.tables = tables;
      for(var i = 0; i < vm.tables.length; i++){
        vm.tables[i].comment = $sce.trustAsHtml(vm.tables[i].comment);
      }
    });

  }
};
