
package cl.duoc.tiendaperritos.product_service.service;

import cl.duoc.tiendaperritos.product_service.messaging.ProductoEventPublisher;
import cl.duoc.tiendaperritos.product_service.model.Producto;
import cl.duoc.tiendaperritos.product_service.repository.ProductoRepository;
import cl.duoc.tiendaperritos.product_service.kafka.dto.ProductoEventoDto;
import cl.duoc.tiendaperritos.product_service.kafka.producer.KafkaProductoProducer;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoEventPublisher productoEventPublisher;
    private final KafkaProductoProducer kafkaProductoProducer;

    public ProductoService(
            ProductoRepository productoRepository,
            ProductoEventPublisher productoEventPublisher,
            KafkaProductoProducer kafkaProductoProducer) {

        this.productoRepository = productoRepository;
        this.productoEventPublisher = productoEventPublisher;
        this.kafkaProductoProducer = kafkaProductoProducer;
    }

    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    public Producto buscarPorId(Integer id) {
        return productoRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Producto no encontrado"
                        )
                );
    }

    // CREAR PRODUCTO
    public Producto crear(Producto producto) {

        producto.setId(null);

        Producto creado = productoRepository.save(producto);

        // Mantener RabbitMQ
        productoEventPublisher.publicarCreado(creado);

        // Nuevo: publicar en Kafka
        publicarEnKafka("CREATED", creado);

        return creado;
    }

    // ACTUALIZAR PRODUCTO
    public Producto actualizar(Integer id, Producto datos) {

        Producto producto = buscarPorId(id);

        producto.setNombre(datos.getNombre());
        producto.setDescripcion(datos.getDescripcion());
        producto.setPrecio(datos.getPrecio());
        producto.setStock(datos.getStock());

        Producto actualizado = productoRepository.save(producto);

        // Mantener RabbitMQ
        productoEventPublisher.publicarActualizado(actualizado);

        // Nuevo: publicar en Kafka
        publicarEnKafka("UPDATED", actualizado);

        return actualizado;
    }

    // ELIMINAR PRODUCTO
    public void eliminar(Integer id) {

        Producto producto = buscarPorId(id);

        productoRepository.delete(producto);

        // Mantener RabbitMQ
        productoEventPublisher.publicarEliminado(producto);

        // Nuevo: publicar en Kafka
        publicarEnKafka("DELETED", producto);
    }

    // CONSTRUIR Y PUBLICAR EVENTOS EN KAFKA
    private void publicarEnKafka(
            String tipoEvento,
            Producto producto) {

        ProductoEventoDto evento = new ProductoEventoDto(
                tipoEvento,
                producto.getId().longValue(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getStock(),
                OffsetDateTime.now().toString()
        );

        kafkaProductoProducer.publicarEvento(evento);
        kafkaProductoProducer.publicarAuditoria(evento);
    }
}
