import { Collection, PreSave, Steward } from "fireball";
import { Field } from "fireball";
import { FireballEngine } from "fireball";
import { FirestoreAdapter } from "fireball";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

// Nested "sub-schema" — Fireball doesn't have a separate @SubSchema concept yet,
// so for now we just declare it as a plain class with its own @Field entries.
// (Fireball's Field.ts doesn't currently resolve nested class metadata —
// this is a placeholder shape until relations/nested-schema support is built.)
class RoomCounts {
  @Field({ type: "number", required: true, default: 0 })
  living!: number;

  @Field({ type: "number", required: true, default: 0 })
  kitchen!: number;

  @Field({ type: "number", required: true, default: 0 })
  bedroom!: number;

  @Field({ type: "number", required: true, default: 0 })
  bathroom!: number;

  @Field({ type: "number", required: true, default: 0 })
  dining!: number;
}

@Collection("quotes", { timestamps: true, softDelete: true })
class Quote extends Steward {
  @Field({ type: "string", required: true })
  bhkType!: string;

  @Field({ type: "map", required: true, schema: RoomCounts })
  rooms!: RoomCounts;

  @Field({ type: "string", required: true })
  package!: string;

  @Field({ type: "string", required: true })
  name!: string;

  @Field({ type: "string", required: true })
  phone!: string;

  @Field({ type: "string", required: true })
  email!: string;

  @Field({ type: "number", required: true })
  estimatedPrice!: number;

  // Lead lifecycle
  @Field({ type: "string", default: "NEW_LEAD" })
  leadStatus!: string;

  @Field({ type: "string", default: "UNCONTACTED" })
  contactStatus!: string;

  @Field({ type: "string", default: "PENDING" })
  dealStatus!: string;

  @PreSave()
  static logBeforeSave(context: Record<string, unknown>) {
    console.log("About to save quote for:", context.name);
  }
}

// --- Sanity check ---
initializeApp();
FireballEngine.init(new FirestoreAdapter(getFirestore("quotes-db")));

async function main() {
  const quote = await Quote.create({
    bhkType: "3BHK",
    package: "premium",
    name: "Rahul",
    phone: "9876543210",
    email: "rahulrr@example.com",
    estimatedPrice: 250000,
    rooms: {
      living: "sd",
      kitchen: 1,
      bedroom: 2,
      bathroom: 2,
      dining: 1,
    },
  });

  console.log("Created with timestamps:", quote);

  await Quote.deleteById(quote.id);
  const afterSoftDelete = await Quote.findById(quote.id);
  console.log("After soft delete (should be null):", afterSoftDelete);

  const restored = await Quote.restoreById(quote.id);
  console.log("After restore:", restored);
}

main().catch((error) => {
  console.error("Application failed:", error);
  process.exit(1);
});
