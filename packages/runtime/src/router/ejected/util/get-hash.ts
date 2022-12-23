import { createHash } from "crypto";

const getSegmentHash = (location: string) =>
  createHash("sha1").update(location).digest("hex").slice(0, 10);

export default getSegmentHash;
