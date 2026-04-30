interface RicochetStepSvgProps {
    fill: string;
    stroke: string;
    directionDeg: number;
    ariaLabel: string;
    onClick?: () => void;
}

const CX = 22;
const CY = 22;
const CIRCLE_R = 18;

export default function RicochetStepSvg({ fill, stroke, directionDeg, ariaLabel, onClick }: RicochetStepSvgProps) {
    const angle = (Math.PI / 180) * directionDeg;
    const perpAngle = angle + Math.PI / 2;
    const tipDist = CIRCLE_R * 0.7;
    const baseDist = CIRCLE_R * 0.28;
    const tx = CX + tipDist * Math.cos(angle);
    const ty = CY + tipDist * Math.sin(angle);
    const b1x = CX - baseDist * Math.cos(angle) + baseDist * Math.cos(perpAngle);
    const b1y = CY - baseDist * Math.sin(angle) + baseDist * Math.sin(perpAngle);
    const b2x = CX - baseDist * Math.cos(angle) - baseDist * Math.cos(perpAngle);
    const b2y = CY - baseDist * Math.sin(angle) - baseDist * Math.sin(perpAngle);

    return (
        <svg
            width={44}
            height={44}
            viewBox="0 0 44 44"
            role="img"
            aria-label={ariaLabel}
            onClick={onClick}
            style={onClick ? { cursor: 'pointer' } : undefined}
        >
            <circle cx={CX} cy={CY} r={CIRCLE_R} fill={fill} stroke={stroke} strokeWidth={1.5} />
            <polygon
                points={`${tx.toFixed(1)},${ty.toFixed(1)} ${b1x.toFixed(1)},${b1y.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)}`}
                fill="#ffffff"
                fillOpacity={0.9}
            />
        </svg>
    );
}
