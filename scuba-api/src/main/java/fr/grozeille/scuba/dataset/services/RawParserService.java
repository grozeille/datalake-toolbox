package fr.grozeille.scuba.dataset.services;

import fr.grozeille.scuba.dataset.model.HiveData;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.hive.ql.io.orc.OrcFile;
import org.apache.hadoop.hive.ql.io.orc.TypeDescription;
import org.apache.hadoop.hive.ql.io.orc.Writer;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspector;
import org.apache.hadoop.hive.serde2.typeinfo.TypeInfo;
import org.apache.hadoop.hive.serde2.typeinfo.TypeInfoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RawParserService {

    @Autowired
    private FileSystem fs;

    public HiveData data(InputStream inputStream, Long limit) throws Exception {
        HiveData result = new HiveData();
        result.setData(new ArrayList<>());
        final String column = "raw";

        try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = br.readLine()) != null) {
                Map<String, Object> row = new HashMap<>(1);
                row.put(column, line);
                result.getData().add(row);
            }
        }
        return result;
    }

    public String[] write(InputStream inputStream, String path) throws Exception {

        org.apache.hadoop.conf.Configuration conf = new org.apache.hadoop.conf.Configuration();

        List<String> columns = new ArrayList<>();

        Path orcPath = new Path(path+"/data.orc");

        // TODO: do better, create versions
        fs.delete(new Path(path), true);

        final String column = "raw";
        TypeDescription schema = TypeDescription.createStruct();
        schema.addField(column, TypeDescription.createString());
        columns.add(column);

        String typeStr = schema.toString();
        TypeInfo typeInfo = TypeInfoUtils.getTypeInfoFromTypeString(typeStr);
        ObjectInspector inspector = TypeInfoUtils.getStandardJavaObjectInspectorFromTypeInfo(typeInfo);
        Writer writer = OrcFile.createWriter(orcPath, OrcFile.writerOptions(conf).inspector(inspector).stripeSize(100000).bufferSize(10000));

        try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = br.readLine()) != null) {
                writer.addRow(line);
            }
        }

        writer.close();

        return columns.toArray(new String[0]);
    }
}
