import fetch from 'node-fetch'
import { 
  sleep, 
  capitalizeFirstLetter 
} from './utils.js'
import {
  TLS_CA,
  DOCKER_SWARM_MANAGER
} from './config.js'

const swarm_base_url = () => TLS_CA === '' ? `http://${DOCKER_SWARM_MANAGER}` : `https://${DOCKER_SWARM_MANAGER}`

function https_agent_maybe() {
  console.log(TLS_CA)
  return {}
}

async function fetch_join_token(type) {
  const swarm = await fetch(`${swarm_base_url()}/swarm`, https_agent_maybe()).then(r => r.json())
  return swarm?.JoinTokens[capitalizeFirstLetter(type)]
}

async function wait_for_node_to_join_swarm(hostname, retries) {
  const nodes  = await fetch(`${swarm_base_url()}/nodes`, https_agent_maybe()).then(r => r.json())
  nodes.forEach(n => console.log(n.Description.Hostname, hostname))
  const node = nodes.find(n => n.Description.Hostname == hostname)
  if (node) return node
  if (!retries) throw new Error(`Unable to find node ${hostname} in swarm`) 
  await sleep(1)
  await wait_for_node_to_join_swarm(hostname, retries-1)
}

async function update_node_in_swarm(node, spec) {
  await fetch(`${swarm_base_url()}/nodes/${node.ID}/update?version=${node.Version.Index}`, {
    method: 'POST',
    body: JSON.stringify(spec),
    ...https_agent_maybe()
  })
}

export async function register_node_in_swarm(req, res, { send, json }) {
  const payload = await json()

  // Fetch and return token 
  const token = await fetch_join_token(payload?.type)
  send(200, { token: token }) 

  // Wait for node to join swarm (5 retries 10 secs wait)
  const node = await wait_for_node_to_join_swarm(payload?.hostname, 5)

  // Update swarm with node metadata
  await update_node_in_swarm(node, Object.assign({}, node.Spec, payload.labels))
}
