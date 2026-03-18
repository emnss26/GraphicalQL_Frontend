import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  }

  const dmy = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0, 0);
};

const formatDMY = (value) => {
  const date = value instanceof Date ? value : parseDate(value);
  if (!date) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const pct = (value, total) => (total > 0 ? (value / total) * 100 : 0);

const startOfWeekMonday = (date) => {
  const out = new Date(date);
  const offset = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - offset);
  out.setHours(12, 0, 0, 0);
  return out;
};

const addDays = (date, days) => {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
};

const toISODateLocal = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : parseDate(dateValue);
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const pickValue = (item, ...keys) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const normalizeTrackingRow = (item) => {
  const row = {
    name: pickValue(item, "name", "sheet_name"),
    number: pickValue(item, "number", "sheet_number"),
    plannedGenDate: parseDate(pickValue(item, "plannedGenDate", "planned_gen_date")),
    actualGenDate: parseDate(pickValue(item, "actualGenDate", "actual_gen_date")),
    plannedReviewDate: parseDate(pickValue(item, "plannedReviewDate", "planned_review_date")),
    actualReviewDate: parseDate(pickValue(item, "actualReviewDate", "actual_review_date")),
    plannedIssueDate: parseDate(pickValue(item, "plannedIssueDate", "planned_issue_date")),
    actualIssueDate: parseDate(pickValue(item, "actualIssueDate", "actual_issue_date")),
  };

  const hasContent = Boolean(
    row.name ||
    row.number ||
    row.plannedGenDate ||
    row.actualGenDate ||
    row.plannedReviewDate ||
    row.actualReviewDate ||
    row.plannedIssueDate ||
    row.actualIssueDate
  );

  return hasContent ? row : null;
};

export default function WeeklyTrackingTable({
  data = [],
  projectId = "global",
  restrictionsByWeek = {},
  onRestrictionChange = () => {},
}) {
  const [weeklyRestrictions, setWeeklyRestrictions] = useState(() => ({ ...(restrictionsByWeek || {}) }));

  useEffect(() => {
    setWeeklyRestrictions({ ...(restrictionsByWeek || {}) });
  }, [restrictionsByWeek, projectId]);

  const weeklyTracking = useMemo(() => {
    const rows = data.map(normalizeTrackingRow).filter(Boolean);
    const total = rows.length;
    if (total === 0) return [];

    const allDates = [];
    rows.forEach((row) => {
      [
        row.plannedGenDate,
        row.actualGenDate,
        row.plannedReviewDate,
        row.actualReviewDate,
        row.plannedIssueDate,
        row.actualIssueDate,
      ].forEach((date) => {
        if (date) allDates.push(date);
      });
    });

    let startDate;
    let endDate;

    if (allDates.length === 0) {
      const today = new Date();
      startDate = startOfWeekMonday(today);
      endDate = addDays(startDate, 6);
    } else {
      const minDate = new Date(Math.min(...allDates.map((date) => date.getTime())));
      const maxDate = new Date(Math.max(...allDates.map((date) => date.getTime())));
      startDate = startOfWeekMonday(minDate);
      endDate = addDays(startOfWeekMonday(maxDate), 6);
    }

    let cursor = new Date(startDate);
    let weekNumber = 1;
    let plannedAcc = 0;
    let actualAcc = 0;
    const result = [];

    while (cursor.getTime() <= endDate.getTime()) {
      const weekStart = new Date(cursor);
      const weekEnd = addDays(weekStart, 6);
      let plannedWeekly = 0;
      let actualWeekly = 0;

      rows.forEach((row) => {
        if (
          row.plannedIssueDate &&
          row.plannedIssueDate.getTime() >= weekStart.getTime() &&
          row.plannedIssueDate.getTime() <= weekEnd.getTime()
        ) {
          plannedWeekly += 1;
        }
        if (
          row.actualIssueDate &&
          row.actualIssueDate.getTime() >= weekStart.getTime() &&
          row.actualIssueDate.getTime() <= weekEnd.getTime()
        ) {
          actualWeekly += 1;
        }
      });

      plannedAcc += plannedWeekly;
      actualAcc += actualWeekly;

      const plannedPct = pct(plannedAcc, total);
      const actualPct = pct(actualAcc, total);

      result.push({
        key: weekStart.toISOString().slice(0, 10),
        weekNumber,
        weekStart,
        weekEnd,
        plannedWeekly,
        actualWeekly,
        plannedTotal: plannedAcc,
        deliveredTotal: actualAcc,
        totalPlans: total,
        plannedPct,
        actualPct,
        indicatorPct: actualPct - plannedPct,
      });

      cursor = addDays(cursor, 7);
      weekNumber += 1;
    }

    return result;
  }, [data]);

  const indicatorDomain = useMemo(() => {
    if (weeklyTracking.length === 0) return [-10, 10];
    const values = weeklyTracking.map((week) => week.indicatorPct);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const padding = Math.max(2, (max - min) * 0.1);
    const domainMin = Math.floor((min - padding) * 10) / 10;
    const domainMax = Math.ceil((max + padding) * 10) / 10;
    return [domainMin, domainMax];
  }, [weeklyTracking]);

  return (
    <Card>
      <CardHeader data-pdf-block>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-primary" /> Seguimiento Semanal
        </CardTitle>
        <CardDescription>
          Semanas del plan, emisiones semanales, acumulados e indicador de diferencia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto" data-pdf-block data-pdf-role="tracking-table">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/30">
                <th className="border border-border px-2 py-2 text-left">Semana</th>
                <th className="border border-border px-2 py-2 text-right">Planos Programados</th>
                <th className="border border-border px-2 py-2 text-right">Avance Real (ACC)</th>
                <th className="border border-border px-2 py-2 text-right">Planos Totales Planeados a Entregar</th>
                <th className="border border-border px-2 py-2 text-right">Planos Totales Entregados</th>
                <th className="border border-border px-2 py-2 text-right">Totales</th>
                <th className="border border-border px-2 py-2 text-right">% Avance Real</th>
                <th className="border border-border px-2 py-2 text-right">% Programado</th>
                <th className="border border-border px-2 py-2 text-right">Indicador</th>
                <th className="border border-border px-2 py-2 text-left">Restricciones</th>
              </tr>
            </thead>
            <tbody>
              {weeklyTracking.length === 0 && (
                <tr>
                  <td className="border border-border px-2 py-3 text-center text-muted-foreground" colSpan={10}>
                    No hay semanas calculables con fechas del plan.
                  </td>
                </tr>
              )}
              {weeklyTracking.map((week) => (
                <tr key={week.key}>
                  <td className="border border-border px-2 py-2">
                    <div className="font-medium">S{week.weekNumber}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDMY(week.weekStart)} - {formatDMY(week.weekEnd)}
                    </div>
                  </td>
                  <td className="border border-border px-2 py-2 text-right">{week.plannedWeekly}</td>
                  <td className="border border-border px-2 py-2 text-right">{week.actualWeekly}</td>
                  <td className="border border-border px-2 py-2 text-right">{week.plannedTotal}</td>
                  <td className="border border-border px-2 py-2 text-right">{week.deliveredTotal}</td>
                  <td className="border border-border px-2 py-2 text-right">{week.totalPlans}</td>
                  <td className="border border-border px-2 py-2 text-right">{week.actualPct.toFixed(2)}%</td>
                  <td className="border border-border px-2 py-2 text-right">{week.plannedPct.toFixed(2)}%</td>
                  <td
                    className={cn(
                      "border border-border px-2 py-2 text-right font-semibold",
                      week.indicatorPct < 0 ? "text-red-600" : "text-emerald-600"
                    )}
                  >
                    {week.indicatorPct > 0 ? "+" : ""}
                    {week.indicatorPct.toFixed(2)}%
                  </td>
                  <td className="border border-border px-2 py-1">
                    <Input
                      value={weeklyRestrictions[week.key] || ""}
                      onChange={(event) =>
                        setWeeklyRestrictions((prev) => ({
                          ...prev,
                          [week.key]: event.target.value,
                        }))
                      }
                      onBlur={(event) => {
                        const nextValue = event.target.value ?? "";
                        const persistedValue = restrictionsByWeek?.[week.key] ?? "";
                        if (nextValue === persistedValue) return;
                        onRestrictionChange({
                          weekKey: week.key,
                          trackingWeek: week.weekNumber,
                          weekEnd: toISODateLocal(week.weekEnd),
                          restriction: nextValue,
                        });
                      }}
                      placeholder="Agregar restriccion..."
                      className="h-7 min-w-[220px] text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {weeklyTracking.length > 0 && (
          <div className="mt-6 rounded-lg border border-border p-3" data-pdf-block data-pdf-role="tracking-chart">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Curva de Avance Semanal
            </h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTracking} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="weekNumber"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `S${value}`}
                  />
                  <YAxis
                    yAxisId="progress"
                    domain={[0, 100]}
                    width={52}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    yAxisId="indicator"
                    orientation="right"
                    domain={indicatorDomain}
                    width={56}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name]}
                    labelFormatter={(_, payload) => {
                      const week = payload?.[0]?.payload;
                      if (!week) return "";
                      return `Semana ${week.weekNumber}: ${formatDMY(week.weekStart)} - ${formatDMY(week.weekEnd)}`;
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="progress"
                    type="monotone"
                    dataKey="actualPct"
                    name="Avance real"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="progress"
                    type="monotone"
                    dataKey="plannedPct"
                    name="Avance programado"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="indicator"
                    type="monotone"
                    dataKey="indicatorPct"
                    name="Indicador (real - programado)"
                    stroke="#84cc16"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
