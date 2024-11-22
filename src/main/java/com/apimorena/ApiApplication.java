package com.apimorena;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@SpringBootApplication
@RestController
public class ApiApplication {
    private static final String JSON_FILE = System.getProperty("user.dir") + "/productos.json";
    private ObjectMapper objectMapper = new ObjectMapper();

    public static void main(String[] args) {
        String port = System.getenv("PORT");
        if (port != null) {
            System.setProperty("server.port", port);
        }
        SpringApplication.run(ApiApplication.class, args);
    }

    private List<Producto> cargarProductos() {
        try {
            File file = new File(JSON_FILE);
            if (!file.exists()) {
                file.createNewFile();
                guardarProductos(new ArrayList<>());
            }
            return objectMapper.readValue(file, 
                objectMapper.getTypeFactory().constructCollectionType(List.class, Producto.class));
        } catch (IOException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private void guardarProductos(List<Producto> productos) {
        try {
            objectMapper.writeValue(new File(JSON_FILE), productos);
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
} 