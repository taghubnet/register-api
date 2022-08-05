import https from 'https'
import fetch from 'node-fetch'
import { 
  sleep, 
  capitalizeFirstLetter 
} from './utils.js'
import {
  TLS_CA,
  TLS_KEY,
  TLS_CERT,
  DOCKER_SWARM_MANAGER,
  WAIT_FOR_NODE_NAPTIME
} from './config.js'

const swarm_base_url = () => TLS_CA === '' ? `http://${DOCKER_SWARM_MANAGER}` : `https://${DOCKER_SWARM_MANAGER}`

function https_agent_maybe() {
  if (TLS_CA != '') return {
    agent: new https.Agent({
      ca: TLS_CA, 
      key: TLS_KEY,
      cert: TLS_CERT
    })
  }
  return {}
}

async function fetch_join_token(type) {
  const swarm = await fetch(`${swarm_base_url()}/swarm`, https_agent_maybe()).then(r => r.json())
  return swarm?.JoinTokens[capitalizeFirstLetter(type)]
}

async function wait_for_node_to_join_swarm(hostname, retries) {
  console.log('Checking nodes for', hostname)
  const nodes  = await fetch(`${swarm_base_url()}/nodes`, https_agent_maybe()).then(r => r.json())
  console.log(`Found ${nodes.length} nodes`)
  const node = nodes.find(n => n.Description.Hostname == hostname)
  console.log(`Found match for ${hostname}:`, node ? 'yes' : 'no')
  if (node) return node
  if (!retries) throw new Error(`Unable to find node ${hostname} in swarm`) 
  await sleep(WAIT_FOR_NODE_NAPTIME)
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
  console.log(`Attempt to register`, payload)

  // Fetch and return token 
  const token = await fetch_join_token(payload?.type)
  send(200, { token: token })

  // Wait for node to join swarm (5 retries 10 secs wait)
  const node = await wait_for_node_to_join_swarm(payload?.hostname, 5)

  // Update swarm with node metadata
  await update_node_in_swarm(node, Object.assign({}, node.Spec, payload.labels))
}
