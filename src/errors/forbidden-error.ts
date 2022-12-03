import { ApplicationError } from "@/protocols";

export function ForbiddenError(): ApplicationError {
  return {
    name: "ForbiddenError",
    message: "Unable to proceed with the request",
  };
}
