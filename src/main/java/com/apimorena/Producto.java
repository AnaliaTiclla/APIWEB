package com.apimorena;

public class Producto {
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