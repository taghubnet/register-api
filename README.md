# Register Api

Service for [docker swarm](https://docs.docker.com/engine/swarm/) worker nodes to register metadata and obtain a swarm join key.

`register-api` is designed to be used as a [linuxkit](https://github.com/linuxkit/linuxkit) service in conjunction with [register-agent](https://github.com/taghubnet/register-agent). It belongs on a node running a `docker swarm manager`.

Agents will query this API and register information about themselves. In return they get a `docker swarm join key` they can use join the swarm as a worker node.

Once the new node is registered in the swarn, this service will decorate it with labels passed in the payload.
