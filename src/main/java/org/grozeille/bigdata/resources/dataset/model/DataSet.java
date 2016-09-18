package org.grozeille.bigdata.resources.dataset.model;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "DATASET")
@Data
public class DataSet {

    @Id
    @Column(name = "ID")
    private String id;

    @Column(name = "JSONCONF")
    private String jsonConf;
}
