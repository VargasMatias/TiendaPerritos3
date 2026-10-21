package cl.duoc.tiendaperritos.product_service.service;

import cl.duoc.tiendaperritos.product_service.messaging.ProductoEventPublisher;
import cl.duoc.tiendaperritos.product_service.model.Producto;
import cl.duoc.tiendaperritos.product_service.repository.ProductoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoEventPublisher productoEventPublisher;


    public ProductoService(
            ProductoRepository productoRepository,
            ProductoEventPublisher productoEventPublisher) {

        this.productoRepository = productoRepository;
        this.productoEventPublisher = productoEventPublisher;
    }


    public List<Producto> listarTodos() {

        return productoRepository.findAll();
    }


    public Producto buscarPorId(Integer id) {

        return productoRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Producto no encontrado"
                        )
                );
    }


    public Producto crear(Producto producto) {

        producto.setId(null);

        Producto creado =
                productoRepository.save(producto);

        productoEventPublisher.publicarCreado(creado);

        return creado;
    }


    public Producto actualizar(
            Integer id,
            Producto datos) {

        Producto producto = buscarPorId(id);

        producto.setNombre(datos.getNombre());
        producto.setDescripcion(datos.getDescripcion());
        producto.setPrecio(datos.getPrecio());
        producto.setStock(datos.getStock());

        Producto actualizado =
                productoRepository.save(producto);

        productoEventPublisher
                .publicarActualizado(actualizado);

        return actualizado;
    }


    public void eliminar(Integer id) {

        Producto producto = buscarPorId(id);

        productoRepository.delete(producto);

        productoEventPublisher
                .publicarEliminado(producto);
    }
}