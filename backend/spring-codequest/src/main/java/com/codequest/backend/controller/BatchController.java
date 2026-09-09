package com.codequest.backend.controller;

import com.codequest.backend.util.ApiMaps;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/batches")
public class BatchController {
    private final JdbcTemplate jdbc;

    public BatchController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/hierarchy/")
    List<Map<String, Object>> hierarchy() {
        if (!tableExists("apis_superbatch") || !tableExists("apis_batch") || !tableExists("apis_subbatch")) {
            return List.of();
        }
        return jdbc.query(
            "select id, name from apis_superbatch order by name",
            (superBatchRs, rowNum) -> {
                Long superBatchId = superBatchRs.getLong("id");
                List<Map<String, Object>> batches = jdbc.query(
                    "select id, name from apis_batch where super_batch_id = ? order by name",
                    (batchRs, batchRowNum) -> {
                        Long batchId = batchRs.getLong("id");
                        List<Map<String, Object>> subBatches = jdbc.query(
                            "select id, name from apis_subbatch where batch_id = ? order by name",
                            (subBatchRs, subBatchRowNum) -> ApiMaps.map(
                                "id", subBatchRs.getLong("id"),
                                "name", subBatchRs.getString("name")
                            ),
                            batchId
                        );
                        return ApiMaps.map(
                            "id", batchId,
                            "name", batchRs.getString("name"),
                            "sub_batches", subBatches
                        );
                    },
                    superBatchId
                );
                return ApiMaps.map(
                    "id", superBatchId,
                    "name", superBatchRs.getString("name"),
                    "batches", batches
                );
            }
        );
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbc.queryForObject(
            "select count(*) from information_schema.tables where table_schema = current_schema() and table_name = ?",
            Integer.class,
            tableName
        );
        return count != null && count > 0;
    }
}
