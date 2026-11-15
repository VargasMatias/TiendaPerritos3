package cl.duoc.tiendaperritos.product_service.kafka;

import cl.duoc.tiendaperritos.product_service.kafka.dto.ProductoEventoDto;
import cl.duoc.tiendaperritos.product_service.kafka.producer.KafkaProductoProducer;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.amqp.autoconfigure.RabbitAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.EnableKafka;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@SpringBootApplication(
    scanBasePackages = "cl.duoc.tiendaperritos.product_service.kafka",
    exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class,
        RabbitAutoConfiguration.class
    }
)
@EnableKafka
public class KafkaPruebaApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(KafkaPruebaApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.run(args);
    }

    @Bean
    ApplicationRunner enviarPrueba(KafkaProductoProducer producer) {
        return args -> {

            ProductoEventoDto evento = new ProductoEventoDto(
                "CREATED",
                9001L,
                "Producto Prueba EP5",
                "Evento de prueba desde Spring Boot",
                new BigDecimal("15990"),
                10,
                OffsetDateTime.now().toString()
            );

            producer.publicarEvento(evento);
            producer.publicarAuditoria(evento);

            ProductoEventoDto eventoInvalido = new ProductoEventoDto(
                "",
                9002L,
                "Producto Invalido EP5",
                "Prueba de reintentos y DLT",
                new BigDecimal("15990"),
                10,
                OffsetDateTime.now().toString()
            );

            producer.publicarEvento(eventoInvalido);

            System.out.println(
                "[KAFKA-DEMO] Envio solicitado de evento invalido ID 9002"
            );


            System.out.println(
                "[KAFKA-DEMO] Publicacion solicitada en ambos topicos"
            );
        };
    }
}