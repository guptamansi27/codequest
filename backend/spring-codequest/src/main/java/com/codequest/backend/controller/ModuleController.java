package com.codequest.backend.controller;

import com.codequest.backend.dto.ApiDtos.ModuleDto;
import com.codequest.backend.entity.Module;
import com.codequest.backend.exception.ApiException;
import com.codequest.backend.mapper.ApiMapper;
import com.codequest.backend.repository.ModuleRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {
    private final ModuleRepository modules;
    public ModuleController(ModuleRepository modules) { this.modules = modules; }
    @GetMapping("/") List<ModuleDto> list() { return modules.findAll().stream().map(ApiMapper::module).toList(); }
    @PostMapping("/") @ResponseStatus(HttpStatus.CREATED) ModuleDto create(@RequestBody ModuleDto dto) {
        Module m = new Module(); m.setName(dto.name()); m.setOrder(dto.order()); m.setActive(dto.isActive() == null || dto.isActive());
        return ApiMapper.module(modules.save(m));
    }
    @GetMapping("/{id}/") ModuleDto get(@PathVariable Long id) { return ApiMapper.module(find(id)); }
    @PatchMapping("/{id}/") ModuleDto patch(@PathVariable Long id, @RequestBody ModuleDto dto) {
        Module m = find(id);
        if (dto.name() != null) m.setName(dto.name());
        if (dto.order() != null) m.setOrder(dto.order());
        if (dto.isActive() != null) m.setActive(dto.isActive());
        return ApiMapper.module(modules.save(m));
    }
    @DeleteMapping("/{id}/") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable Long id) { modules.delete(find(id)); }
    private Module find(Long id) { return modules.findById(id).orElseThrow(() -> ApiException.notFound("Module not found")); }
}
