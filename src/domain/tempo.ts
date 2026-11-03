export function minutosDoDia(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function paraHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function arredondarParaCima(min: number, passo: number): number {
  return Math.ceil(min / passo) * passo;
}
