import "./Card.css";

// Plain surface container. `raised` adds the elevated shadow for cards that sit
// on top of other cards (funds card, gainers/losers columns, etc).
export default function Card({ children, className = "", padded = true, raised = false, ...rest }) {
  const classes = ["card", padded ? "card--padded" : "", raised ? "card--raised" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
