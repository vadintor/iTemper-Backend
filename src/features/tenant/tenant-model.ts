import mongoose, { Connection, Document, Model, Schema } from "mongoose";
import log from "../../services/logger";

export function tenantModel<T extends Document>(name: string, schema: Schema, tenantID: string,
                                                connection: Connection, collectionName?: string): Model<T>  {
  log.debug("tenantModel tenantId=" + tenantID);
  const Model = connection.model<T>(name, schema);

  Model.schema.set("discriminatorKey", "tenantID");

  const discriminatorName = `${Model.modelName}-${tenantID}`;
  const existingDiscriminator = (Model.discriminators || {})[discriminatorName];
  return existingDiscriminator || Model.discriminator(discriminatorName, new Schema({}));
}
