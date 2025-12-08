import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResultadoDiagnostico } from '@/types';

interface ProbabilidadesChartProps {
  resultado: ResultadoDiagnostico;
}

export function ProbabilidadesChart({ resultado }: ProbabilidadesChartProps) {
  // Extraer probabilidades del objeto intermedio
  const intermedio = resultado.intermedio || {};
  
  // Buscar probabilidades en diferentes formatos posibles
  let probabilidades: { name: string; value: number; color: string }[] = [];

  if (intermedio.probabilidades) {
    probabilidades = Object.entries(intermedio.probabilidades).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof value === 'number' ? value * 100 : 0,
      color: key.toLowerCase().includes('dengue') ? '#fbbf24' : key.toLowerCase().includes('covid') ? '#ef4444' : '#94a3b8',
    }));
  } else if (intermedio.P_Dengue !== undefined || intermedio.P_COVID !== undefined) {
    probabilidades = [
      {
        name: 'Dengue',
        value: (intermedio.P_Dengue || 0) * 100,
        color: '#fbbf24',
      },
      {
        name: 'COVID-19',
        value: (intermedio.P_COVID || 0) * 100,
        color: '#ef4444',
      },
    ];
  } else if (intermedio.dengue !== undefined || intermedio.covid !== undefined) {
    probabilidades = [
      {
        name: 'Dengue',
        value: (intermedio.dengue || 0) * 100,
        color: '#fbbf24',
      },
      {
        name: 'COVID-19',
        value: (intermedio.covid || 0) * 100,
        color: '#ef4444',
      },
    ];
  }

  if (probabilidades.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Probabilidades</CardTitle>
        <CardDescription>Distribución de probabilidades del diagnóstico</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={probabilidades}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} label={{ value: 'Probabilidad (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {probabilidades.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

