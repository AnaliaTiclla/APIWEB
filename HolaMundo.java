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
public class HolaMundo {

    private static final String JSON_FILE = "productos.json";
    private ObjectMapper objectMapper = new ObjectMapper();

    private List<Producto> cargarProductos() {
        try {
            File file = new File(JSON_FILE);
            if (file.exists()) {
                return objectMapper.readValue(file, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Producto.class));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    private void guardarProductos(List<Producto> productos) {
        try {
            objectMapper.writeValue(new File(JSON_FILE), productos);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        SpringApplication.run(HolaMundo.class, args);
    }

    @GetMapping("/")
    public String holaMundo() {
        return "¡Hola Mundo!";
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

class Producto {
    private int id;
    private String nombre;
    private double precio;
    private String categoria;
    private String descripcion;
    private int stock;
    private String color;

    // Getters y Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public double getPrecio() { return precio; }
    public void setPrecio(double precio) { this.precio = precio; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
} 