import { useParams } from "react-router-dom";
import { useProductionStore } from "../stores/useProductionStore";
import ResultCanva from "../components/ResultCanva";

export default function ProductionPage() {
  const { id } = useParams<{ id: string }>();
  const record = useProductionStore((state) =>
    state.records.find((r) => r.id === id)
  );

  if (!record) {
    return <p style={{ padding: "2rem" }}>找不到該產製紀錄</p>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <ResultCanva record={record} />
    </div>
  );
}
