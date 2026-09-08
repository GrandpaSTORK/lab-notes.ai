export const SNAPSHOT_BOUNDARY = "Summary is not the product. The evidence trail is."
export const SNAPSHOT_LIMITATIONS = [
  "This snapshot is derived from its inputs and has no authority over them.",
  "Mechanical validation establishes artifact identity and traceability, not truth or semantic correctness.",
  "Model interpretations and potential unseen dissent remain contestable; quotation matching does not establish materiality.",
  "Human dispositions are preserved judgments, not participant-confirmed meaning.",
  "No consensus, representativeness, policy sufficiency or organisational effectiveness is established.",
  "Complete detection of dissent and complete understanding of examined records are not established.",
  "Hashes are integrity bindings, not signatures or independent attestation of authorship or time.",
] as const
export const ZERO_DISSENT = ["No potential unseen dissent was surfaced by this challenge run.", "This does not establish that no dissent exists."] as const
