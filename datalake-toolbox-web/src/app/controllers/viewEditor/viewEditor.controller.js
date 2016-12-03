require('./viewEditor.css');

module.exports = {
  controller: ViewEditorController,
  controllerAs: 'viewEditor',
  template: require('./viewEditor.html')
};


/** @ngInject */
function ViewEditorController($timeout, $log, $uibModal, $state, $stateParams, $scope, $rootScope, $window, preparationService, hiveService) {
  var vm = this;
  vm.maxRows = 10000;
  vm.selectedColumn = null;
  vm.selectedDatabase = null;
  vm.selectedTable = null;
  vm.selectedColumnIsCalculated = null;

  vm.name = "";
  vm.description = "";

  vm.renameField = null;
  vm.renameDescription = null;
  vm.changeType = null;

  vm.isLoading = false;
  vm.activeTab = 0;

  vm.tables = [];
  vm.calculatedColumns = [];
  vm.isColumnLinked = { };

  vm.name = preparationService.getName();
  vm.description = preparationService.getComment();

  vm.queryGroup = preparationService.getFilter();
  vm.queryFields = [ ];

  function htmlEntities(str) {
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function computed(group) {
    if (!group) return "";
    if(!group.rules) return "";

    for (var str = "(", i = 0; i < group.rules.length; i++) {
      i > 0 && (str += " <strong>" + group.operator + "</strong> ");

      if(group.rules[i].group){
        str += computed(group.rules[i].group);
      }
      else {
        if(group.rules[i].condition.localeCompare('IS NULL') == 0 || group.rules[i].condition.localeCompare('IS NOT NULL') == 0){
          str += group.rules[i].field.name + " " + htmlEntities(group.rules[i].condition);
        }
        else if(group.rules[i].condition.localeCompare('IN') == 0 || group.rules[i].condition.localeCompare('NOT IN') == 0){
          str += group.rules[i].field.name + " " + htmlEntities(group.rules[i].condition) + " [" + group.rules[i].data+"]";
        }
        else {
          str += group.rules[i].field.name + " " + htmlEntities(group.rules[i].condition) + " " + group.rules[i].data;
        }
      }
    }

    return str + ")";
  }

  vm.computedGroup = function(){
    return "<b>Filter:</b> "+computed(vm.queryGroup);
  }

  preparationService.subscribeOnChange($scope, function(){
    vm.refreshTables();
    $log.info('Refreshed after changes at: ' + new Date());
  });

  var savedModal = require('./saved/saved.controller');

  vm.save = function(){
    preparationService.setName(vm.name);
    preparationService.setComment(vm.description);
    preparationService.setFilter(vm.queryGroup);
    preparationService.saveView();
    $log.info('Save at: ' + new Date());

    savedModal.resolve = {
      viewName: function () {
        return vm.name;
      }
    };

    var modalInstance = $uibModal.open(savedModal);

  };

  vm.refreshTables = function(){
    vm.selectedColumn = null;
    vm.selectedDatabase = null;
    vm.selectedTable = null;
    vm.selectedColumnIsCalculated = null;
    vm.queryFields = [];

    vm.tables = preparationService.getTables();
    vm.calculatedColumns = preparationService.getCalculatedColumns();
    var links = preparationService.getLinks();
    vm.isColumnLinked = { };
    for(var l = 0; l < links.length; l++){
      var link = links[l];
      vm.isColumnLinked[link.left.database+"."+link.left.table+"."+link.left.column] = true;
      //vm.isColumnLinked[link.right.database+"."+link.right.table+"."+link.right.column] = true;
    }

    var columnDefs = [];

    for(var t = 0; t < vm.tables.length; t++){
      var table = vm.tables[t];

      for(var c = 0; c < table.columns.length; c++){
        var column = table.columns[c];

        vm.queryFields.push({
          name: table.database+"."+table.table+"."+column.newName,
          groupName: table.database+"."+table.table,
          database: table.database,
          table: table.table,
          column: column.name
        });

        if(column.selected) {
          columnDefs.push({
            field: column.newName.toLowerCase(),
            enableHiding: false,
            minWidth: 70,
            width: 100,
            headerCellTemplate: 'app/controllers/viewEditor/header-cell-template.html',
            hive: {
              database: table.database,
              table: table.table,
              column: column
            }
          });
        }
      }
    }

    for(var c = 0; c < vm.calculatedColumns.length; c++){
      var column = vm.calculatedColumns[c];

      columnDefs.push({
        field: column.newName.toLowerCase(),
        enableHiding: false,
        minWidth: 70,
        width: 100,
        enableColumnResizing: true,
        headerCellTemplate: 'app/controllers/viewEditor/header-cell-template.html',
        hive: {
          database: "",
          table: "",
          column: column
        }
      });
    }



    vm.gridSampleOptions = {
      enableSorting: false,
      enableColumnMenus: false,
      enableColumnResizing: true,
      appScopeProvider: vm,
      columnDefs: columnDefs,
      data : [ ],
      onRegisterApi: function( gridApi ) {
        vm.gridSampleApi = gridApi;
      }
    };
  };

  var linksModal = require('./links/links.controller');

  vm.links = function(table) {
    linksModal.size = 'lg';
    linksModal.resolve = {
      database: function () {
        return table.database;
      },
      table: function() {
        return table.table;
      }
    };
    var modalInstance = $uibModal.open(linksModal);
  };

  var deleteTableModal = require('./deleteTable/deleteTable.controller');

  vm.removeTable = function(table){
    deleteTableModal.resolve = {
      database: function () {
        return table.database;
      },
      table: function() {
        return table.table;
      }
    };

    var modalInstance = $uibModal.open(deleteTableModal);
  };

  vm.getData = function(){
    vm.isLoading = true;
    return preparationService.getData(vm.maxRows).then(function(data){
      if(data != null){
        vm.gridSampleOptions.data = data.data;
      }
      vm.isLoading = false;
    }).catch(function(error) {
      vm.isLoading = false;
    });
  };

  vm.cancelGetData = function(){
    preparationService.cancelGetData("user cancel");
  };

  vm.rename = function(){
    if(angular.isDefined(vm.selectedColumn)){
      vm.selectedColumn.newName = vm.renameField;
      vm.selectedColumn.newDescription = vm.renameDescription;
      vm.selectedColumn.newType = vm.changeType;

      vm.refreshTables();
    }
  };

  vm.makeTablePrimary = function(database, table){
    preparationService.makeTablePrimary(database, table);
  };

  vm.isColumnSelected = function(col) {
    return vm.selectedColumn === col.colDef.hive.column &&
      vm.selectedDatabase === col.colDef.hive.database &&
      vm.selectedTable === col.colDef.hive.table;
  };

  vm.selectColumn = function(col){
    // if it's the same, unselect it
    if( angular.isDefined(vm.selectedColumn) && vm.selectedColumn != null &&
        col.colDef.hive.column.name.localeCompare(vm.selectedColumn.name) == 0 &&
        col.colDef.hive.database.localeCompare(vm.selectedDatabase) == 0 &&
        col.colDef.hive.table.localeCompare(vm.selectedTable) == 0) {

      vm.unSelectColumn();
      return;
    };

    vm.selectedColumn = col.colDef.hive.column;
    vm.selectedDatabase = col.colDef.hive.database;
    vm.selectedTable = col.colDef.hive.table;
    vm.selectedColumnIsCalculated = col.colDef.hive.column.isCalculated;

    if(angular.isDefined(vm.selectedColumn)  && vm.selectedColumn != null){
      vm.renameField = vm.selectedColumn.newName;
      vm.renameDescription = vm.selectedColumn.newDescription;
      vm.changeType = vm.selectedColumn.newType;
    }

    if(vm.selectedColumnIsCalculated){
      vm.activeTab = 3;
    }
    else {
      vm.activeTab = 2;
    }

  };

  vm.unSelectColumn = function(){
    vm.selectedColumn = null;
    vm.selectedDatabase = null;
    vm.selectedTable = null;
    vm.selectedColumnIsCalculated = null;

    vm.activeTab = 0;
  };

  vm.onColumnSelectionChange = function(column) {
    preparationService.notifyOnChange();
  }


  vm.createCalculated = function(){
    if(angular.isDefined(vm.selectedColumn)  && vm.selectedColumn != null){
      var calculatedColumn = {
        name: "calculated_"+preparationService.getNextCalculatedColumnSequence(),
        newName: vm.selectedColumn.newName+" calculated",
        newDescription: "",
        formula: "`"+vm.selectedColumn.newName+"`",
        isCalculated: true
      };
      preparationService.addCalculatedColumn(calculatedColumn);


      // TODO select the new column
      //vm.gridSampleOptions.columnDefs
      //vm.selectColumn
    }
  };

  var deleteCalculatedModal = require('./deleteCalculated/deleteCalculated.controller');

  vm.removeCalculatedColumn = function($event, column) {

    $event.preventDefault();

    deleteCalculatedModal.resolve = {
      columnName: function() {
        return column.name;
      }
    };
    var modalInstance = $uibModal.open(deleteCalculatedModal);
  };

  function activate(){

    vm.refreshTables();
  }

  activate();


};
