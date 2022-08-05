export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}
export async function sleep(seconds) {
  await new Promise(resolve => setTimeout(resolve, seconds*1000))
}
