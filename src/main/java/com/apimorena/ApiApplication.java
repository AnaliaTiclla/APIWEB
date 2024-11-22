package com.apimorena;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.PostConstruct;

@SpringBootApplication
@RestController
@CrossOrigin(origins = "*")
public class ApiApplication {
    @Value("${data.file.path}")
    private String jsonFilePath;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static void main(String[] args) {
        SpringApplication.run(ApiApplication.class, args);
    }

    @PostConstruct
    public void init() {
        File file = new File(jsonFilePath);
        if (!file.exists()) {
            try {
                file.createNewFile();
                objectMapper.writeValue(file, new ArrayList<>());
            } catch (IOException e) {
                throw new RuntimeException("Error creando archivo JSON", e);
            }
        }
    }

    private List<Producto> cargarProductos() {
        try {
            File file = new File(jsonFilePath);
            if (file.exists()) {
                return objectMapper.readValue(file, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Producto.class));
            }
        } catch (IOException e) {
            throw new RuntimeException("Error al cargar productos", e);
        }
        return new ArrayList<>();
    }

    private void guardarProductos(List<Producto> productos) {
        try {
            objectMapper.writeValue(new File(jsonFilePath), productos);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @GetMapping("/productos")
    public List<Producto> obtenerProductos() {
        return cargarProductos();
    }

    @PostMapping("/productos")
    public ResponseEntity<Producto> agregarProducto(@RequestBody Producto producto) {
        try {
            List<Producto> productos = cargarProductos();
            productos.add(producto);
            guardarProductos(productos);
            return new ResponseEntity<>(producto, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/productos/{id}")
    public Producto obtenerProducto(@PathVariable int id) {
        return cargarProductos().stream()
                .filter(p -> p.getId() == id)
                .findFirst()
                .orElse(null);
    }

    @GetMapping("/")
    public ResponseEntity<String> root() {
        return ResponseEntity.ok("API running");
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
} 