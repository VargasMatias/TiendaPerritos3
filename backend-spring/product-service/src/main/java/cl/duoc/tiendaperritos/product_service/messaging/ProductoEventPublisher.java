package cl.duoc.tiendaperritos.product_service.messaging;

import cl.duoc.tiendaperritos.product_service.event.ProductoEvent;
import cl.duoc.tiendaperritos.product_service.model.Producto;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import tools.jackson.databind.ObjectMapper;

@Component
public class ProductoEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.rabbit.exchanges.direct}")
    private String directExchange;

    @Value("${app.rabbit.exchanges.topic}")
    private String topicExchange;

    @Value("${app.rabbit.routing-keys.notification}")
    private String createdRoutingKey;

    @Value("${app.rabbit.routing-keys.updated}")
    private String updatedRoutingKey;

    @Value("${app.rabbit.routing-keys.deleted}")
    private String deletedRoutingKey;

    @Value("${app.rabbit.routing-keys.document}")
    private String documentRoutingKey;


    public ProductoEventPublisher(
            RabbitTemplate rabbitTemplate,
            ObjectMapper objectMapper) {

        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }


    public void publicarCreado(Producto producto) {

        ProductoEvent evento = crearEvento(
                "CREATED",
                producto
        );

        String json = convertirJson(evento);

        // Cola de notificaciones mediante Direct Exchange
        rabbitTemplate.convertAndSend(
                directExchange,
                createdRoutingKey,
                json
        );

        // Cola de auditoría mediante Topic Exchange
        rabbitTemplate.convertAndSend(
                topicExchange,
                createdRoutingKey,
                json
        );

        // Cola de documentos mediante Direct Exchange
        rabbitTemplate.convertAndSend(
                directExchange,
                documentRoutingKey,
                json
        );

        System.out.println(
                "[RABBIT] Producto CREATED publicado. ID="
                        + producto.getId()
        );
    }


    public void publicarActualizado(Producto producto) {

        ProductoEvent evento = crearEvento(
                "UPDATED",
                producto
        );

        String json = convertirJson(evento);

        rabbitTemplate.convertAndSend(
                topicExchange,
                updatedRoutingKey,
                json
        );

        System.out.println(
                "[RABBIT] Producto UPDATED publicado. ID="
                        + producto.getId()
        );
    }


    public void publicarEliminado(Producto producto) {

        ProductoEvent evento = crearEvento(
                "DELETED",
                producto
        );

        String json = convertirJson(evento);

        rabbitTemplate.convertAndSend(
                topicExchange,
                deletedRoutingKey,
                json
        );

        System.out.println(
                "[RABBIT] Producto DELETED publicado. ID="
                        + producto.getId()
        );
    }


    private ProductoEvent crearEvento(
            String tipo,
            Producto producto) {

        return new ProductoEvent(
                tipo,
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getStock()
        );
    }


    private String convertirJson(ProductoEvent evento) {

        try {

            return objectMapper.writeValueAsString(evento);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Error convirtiendo ProductoEvent a JSON",
                    e
            );
        }
    }
}