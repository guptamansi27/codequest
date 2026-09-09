package com.codequest.backend.util;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ApiMaps {
    private ApiMaps() {}
    public static Map<String, Object> map(Object... kv) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i + 1 < kv.length; i += 2) out.put(String.valueOf(kv[i]), kv[i + 1]);
        return out;
    }
    public static int percent(long part, long total) {
        return total == 0 ? 0 : Math.round((part * 100f) / total);
    }
}
