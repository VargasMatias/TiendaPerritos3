
package cl.duoc.tiendaperritos.kafkaadmin.controller;

import org.apache.kafka.clients.admin.Admin;
import org.apache.kafka.clients.admin.AlterConfigOp;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.config.ConfigResource;

import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/kafka")
public class KafkaAdminController {

    private final KafkaAdmin kafkaAdmin;

    public KafkaAdminController(KafkaAdmin kafkaAdmin) {
        this.kafkaAdmin = kafkaAdmin;
    }

    // Listar todos los topicos
    @GetMapping("/topics")
    public List<String> listarTopicos() throws Exception {

        try (Admin admin = crearCliente()) {
            return admin.listTopics()
                    .names()
                    .get(20, TimeUnit.SECONDS)
                    .stream()
                    .sorted()
                    .toList();
        }
    }

    // Crear un topico de prueba
    @PostMapping("/topics")
    public Map<String, Object> crearTopico(
            @RequestBody CrearTopicoRequest request
    ) throws Exception {

        validarTopicoPrueba(request.nombre());

        if (request.particiones() < 1 ||
                request.replicas() != 3 ||
                request.retencionMs() < 60000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Parametros invalidos"
            );
        }

        NewTopic topico = new NewTopic(
                request.nombre(),
                request.particiones(),
                request.replicas()
        ).configs(Map.of(
                "retention.ms",
                String.valueOf(request.retencionMs())
        ));

        try (Admin admin = crearCliente()) {
            admin.createTopics(List.of(topico))
                    .all()
                    .get(20, TimeUnit.SECONDS);
        }

        return Map.of(
                "estado", "CREADO",
                "topico", request.nombre(),
                "particiones", request.particiones(),
                "replicas", request.replicas()
        );
    }

    // Consultar configuracion
    @GetMapping("/topics/{nombre}/config")
    public Map<String, String> consultarConfiguracion(
            @PathVariable String nombre
    ) throws Exception {

        ConfigResource recurso = new ConfigResource(
                ConfigResource.Type.TOPIC,
                nombre
        );

        try (Admin admin = crearCliente()) {

            Config configuracion = admin.describeConfigs(
                    List.of(recurso)
            ).all().get(20, TimeUnit.SECONDS).get(recurso);

            return Map.of(
                    "topico", nombre,
                    "retention.ms",
                    configuracion.get("retention.ms").value(),
                    "cleanup.policy",
                    configuracion.get("cleanup.policy").value()
            );
        }
    }

    // Modificar tiempo de retencion
    @PatchMapping("/topics/{nombre}/retencion")
    public Map<String, Object> modificarRetencion(
            @PathVariable String nombre,
            @RequestBody RetencionRequest request
    ) throws Exception {

        validarTopicoPrueba(nombre);

        if (request.retencionMs() < 60000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La retencion debe ser al menos 60000 ms"
            );
        }

        ConfigResource recurso = new ConfigResource(
                ConfigResource.Type.TOPIC,
                nombre
        );

        AlterConfigOp operacion = new AlterConfigOp(
                new ConfigEntry(
                        "retention.ms",
                        String.valueOf(request.retencionMs())
                ),
                AlterConfigOp.OpType.SET
        );

        try (Admin admin = crearCliente()) {
            admin.incrementalAlterConfigs(
                    Map.of(recurso, List.of(operacion))
            ).all().get(20, TimeUnit.SECONDS);
        }

        return Map.of(
                "estado", "ACTUALIZADO",
                "topico", nombre,
                "retencionMs", request.retencionMs()
        );
    }

    // Eliminar topico de prueba
    @DeleteMapping("/topics/{nombre}")
    public Map<String, String> eliminarTopico(
            @PathVariable String nombre
    ) throws Exception {

        validarTopicoPrueba(nombre);

        try (Admin admin = crearCliente()) {
            admin.deleteTopics(List.of(nombre))
                    .all()
                    .get(20, TimeUnit.SECONDS);
        }

        return Map.of(
                "estado", "ELIMINADO",
                "topico", nombre
        );
    }

    private Admin crearCliente() {
        return Admin.create(
                kafkaAdmin.getConfigurationProperties()
        );
    }

    // Seguridad: no modificar topicos de produccion
    private void validarTopicoPrueba(String nombre) {

        if (nombre == null ||
                !nombre.matches("ep5\\.prueba\\.[a-zA-Z0-9._-]+")) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo se pueden modificar topicos ep5.prueba.*"
            );
        }
    }

    public record CrearTopicoRequest(
            String nombre,
            int particiones,
            short replicas,
            long retencionMs
    ) {}

    public record RetencionRequest(
            long retencionMs
    ) {}
}
