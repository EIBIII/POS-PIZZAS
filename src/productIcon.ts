// Ícono por defecto de cada categoría de ingrediente (usado en Extras e Inventario).
export const CATEGORY_ICONS: Record<string, string> = {
  cat1: 'tag',
  cat2: 'package',
  cat3: 'drink',
  cat4: 'bag',
}

// Opciones disponibles para que el usuario asigne un ícono específico a un
// producto/ingrediente desde Inventario, y así identificarlo mejor en Extras.
export const EXTRA_ICON_OPTIONS = [
  'drink', 'beer', 'juice', 'water', 'pizza', 'plate', 'napkin', 'bag', 'shoppingBag', 'package', 'tag',
]

// Resuelve el ícono a mostrar para un ingrediente: el asignado manualmente,
// si no hay uno, una inferencia simple por nombre (solo bebidas), y si no,
// el ícono por defecto de su categoría.
export function getIngredientIcon(ing: { icon?: string; categoryId: string; name: string }): string {
  if (ing.icon) return ing.icon
  if (ing.categoryId === 'cat3') {
    const n = ing.name.toLowerCase()
    if (n.includes('agua')) return 'water'
    if (n.includes('jugo')) return 'juice'
    if (n.includes('cerveza') || n.includes('beer')) return 'beer'
    return 'drink'
  }
  return CATEGORY_ICONS[ing.categoryId] || 'tag'
}
