export interface PricingResult {
    subtotal: number 
    discountAmount: number
    total: number
}

const PRICING_RULES = [
    {start: 8, end: 16, price: 250},
    {start: 16, end: 24, price: 300}
]

export function getDynamicPrice (hour: string): number {
    const h = Number(hour)
    if (isNaN(h)) return 0

    const rule = PRICING_RULES.find(r => h >= r.start && h < r.end)

    return rule ? rule.price : 0
}

export function calculateTotal (
    slots: string[],
    discount: number = 0
): PricingResult {
    
    let subtotal = 0

    slots.forEach((s) => {
        const hour = s.split(':')[0]
        subtotal += getDynamicPrice(hour)
    })

    const discountAmount = subtotal * discount

    return {
        subtotal,
        discountAmount,
        total: subtotal - discountAmount
    }
}

export function isSlotBooked (
    slot: string,
    bookedSlots: string[]
): boolean {
    return bookedSlots.includes(slot)
}

export function buildSlotRange (
    slots: string[],
    allSlots: string[],
    bookedSlots: string[]
): string[] {
    const sorted = [...slots].sort(
        (a, b) => Number(a.split(':')[0]) - Number(b.split(':')[0])
    )

    const fi = allSlots.indexOf(sorted[0])
    const li = allSlots.indexOf(sorted[sorted.length-1])

    const range = allSlots.slice(fi, li + 1)

    const valid =
        range.length <= 3 &&
        range.every((s) => !bookedSlots.includes(s))

     return valid ? range : [slots[slots.length - 1]]   
}
