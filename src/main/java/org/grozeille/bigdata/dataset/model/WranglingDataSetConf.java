package org.grozeille.bigdata.dataset.model;

import lombok.Data;

@Data
public class WranglingDataSetConf {

    private WranglingDataSetConfTable[] tables;

    private WranglingDataSetConfLink[] links;

    private WranglingDataSetConfColumn[] calculatedColumns;

    private WranglingDataSetFilterGroup filter;
}
