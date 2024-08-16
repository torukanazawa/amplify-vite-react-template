"use client";
import { useEffect, useRef, useState } from "react";

export default function Component({ onBet }) {
  const chipsArr = [100, 25, 5, 0, 1, 10];
  const setting = {
    viewBox: { width: 250, height: 250 },
    radius1: 60,
    radius2: 120,
    base: "#000000",
    stroke: "rgb(50, 235, 229)",
    textColor: "white",
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const datas: any = useRef(
    chipsArr.map((n, i) => {
      const { x, y, radius1, radius2, startAngle, endAngle } = {
        x: setting.viewBox.width * 0.5,
        y: setting.viewBox.height * 0.5,
        radius1: setting.radius1,
        radius2: setting.radius2,
        startAngle: (360 / chipsArr.length) * i - (360 / chipsArr.length) * 0.5,
        endAngle: (360 / chipsArr.length) * (i + 1) - (360 / chipsArr.length) * 0.5,
      };

      const start1 = polarToCartesian(x, y, radius1, endAngle);
      const end1 = polarToCartesian(x, y, radius1, startAngle);
      const start2 = polarToCartesian(x, y, radius2, endAngle);
      const end2 = polarToCartesian(x, y, radius2, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      const d = ["M", start1.x, start1.y, "A", radius1, radius1, 0, largeArcFlag, 0, end1.x, end1.y, "L", end2.x, end2.y, "A", radius2, radius2, 0, largeArcFlag, 1, start2.x, start2.y, "Z"].join(" ");

      const centerAngle = startAngle + (endAngle - startAngle) * 0.5;
      const center = polarToCartesian(x, y, radius1, centerAngle);

      return {
        d,
        number: n,
        text: {
          x: center.x,
          y: center.y - 20,
          transform: `rotate(${centerAngle},${center.x},${center.y})`,
        },
      };
    })
  );

  return (
    <svg width={setting.viewBox.width} height={setting.viewBox.height} viewBox={`0 0 ${setting.viewBox.width} ${setting.viewBox.height}`}>
      {datas.current.map((data, i) => (
        <g
          key={i}
          onClick={() => {
            onBet((n) => (data.number == 0 ? 0 : n + data.number));
          }}
        >
          <path stroke={setting.stroke} strokeWidth="1" d={data.d} fill={setting.base} />
          <text
            fill={setting.textColor}
            x={data.text.x}
            y={data.text.y}
            transform={data.text.transform}
            fontFamily=""
            fontSize="30"
            // fontWeight="bold"
            textAnchor="middle"
          >
            {data.number}
          </text>
        </g>
      ))}
    </svg>
  );
}
