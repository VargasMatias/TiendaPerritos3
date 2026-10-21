package cl.duoc.tiendaperritos.product_service.consumer;

import com.rabbitmq.client.Channel;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class AuditConsumer {

    @RabbitListener(queues = "${app.rabbit.queues.audit}")
    public void consumir(
            Message message,
            Channel channel) throws IOException {

        long deliveryTag =
                message.getMessageProperties().getDeliveryTag();

        String contenido =
                new String(
                        message.getBody(),
                        StandardCharsets.UTF_8
                );

        try {

            System.out.println(
                    "[AUDIT] Evento registrado: "
                            + contenido
            );

            channel.basicAck(
                    deliveryTag,
                    false
            );

            System.out.println(
                    "[AUDIT] ACK enviado correctamente"
            );

        } catch (Exception e) {

            System.err.println(
                    "[AUDIT] ERROR: "
                            + e.getMessage()
            );

            channel.basicNack(
                    deliveryTag,
                    false,
                    false
            );

            System.err.println(
                    "[AUDIT] NACK enviado"
            );
        }
    }
}