export function getAvatarGradient(name: string): string {

    const gradients = [

        'linear-gradient(135deg, #ec7948, #f4753f)',
        'linear-gradient(135deg, #F59E0B, #F97316)',
        'linear-gradient(135deg, #10B981, #14B8A6)',
        'linear-gradient(135deg, #3B82F6, #06B6D4)',
        'linear-gradient(135deg, #8B5CF6, #D946EF)',
        'linear-gradient(135deg, #6366F1, #8B5CF6)',
        'linear-gradient(135deg, #EF4444, #F97316)',
        'linear-gradient(135deg, #22C55E, #84CC16)'

    ];

    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return gradients[Math.abs(hash) % gradients.length];
}