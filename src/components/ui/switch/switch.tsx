import "./switch.css";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Lets a `<label htmlFor>` name this switch (and makes the label clickable). */
  id?: string;
  /** Id of an element that describes the switch, e.g. a hint. */
  describedBy?: string;
}

export function Switch({ checked, onCheckedChange, id, describedBy }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-describedby={describedBy}
      className="switch"
      onClick={() => {
        onCheckedChange(!checked);
      }}
    >
      <span className="switch__thumb" />
    </button>
  );
}
