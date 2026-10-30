import React, { useState } from "react";
import { Alert, Button, Card, Form, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import { FaInfoCircle, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { useMsal } from "@azure/msal-react";
import { isLeft } from "fp-ts/lib/Either";
import { isValidIBAN } from "ibantools";
import { Iban } from "../../../generated/api/Iban";
import { IbanEnhanced } from "../../../generated/api/IbanEnhanced";
import { ProblemJson } from "../../../generated/api/ProblemJson";
import { loginRequest } from "../../authConfig";
import ConfirmationModal from "../../components/ConfirmationModal";
import { apiClient } from "../../util/apiClient";

interface IProps {
    code: string;
    ibans: ReadonlyArray<Iban>;
    onChanged: () => void;
}

const emptyForm = {
    iban: "",
    description: "",
    is_active: true,
    validity_date: "",
    due_date: ""
};
const operationError = "Operazione non avvenuta a causa di un errore";

function errorMessage(value: unknown): string {
    const problem = ProblemJson.decode(value);
    return isLeft(problem) ? operationError : problem.right.detail || problem.right.title || operationError;
}

function notifyError(message = operationError): void {
    toast.error(message, { theme: "colored" });
}

export default function CreditorInstitutionIbans({ code, ibans, onChanged }: IProps) {
    const { instance, accounts } = useMsal();
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [deleting, setDeleting] = useState<string>();
    const [busy, setBusy] = useState(false);

    function discard(): void {
        setCreating(false);
        setForm(emptyForm);
    }

    async function persist(action: IbanEnhanced | string): Promise<void> {
        if (busy) {
            return;
        }
        setBusy(true);
        try {
            const token = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
            const parameters = {
                Authorization: `Bearer ${token.accessToken}`,
                ApiKey: "",
                creditorinstitutioncode: code
            };
            const removing = typeof action === "string";
            const result = typeof action === "string"
                ? await apiClient.deleteCreditorInstitutionsIban({ ...parameters, ibanValue: action })
                : await apiClient.createCreditorInstitutionsIbans({ ...parameters, body: action });
            if (isLeft(result)) {
                notifyError();
            } else if (result.right.status === (removing ? 200 : 201)) {
                toast.info(removing ? "Rimozione avvenuta con successo" : "Salvataggio avvenuto con successo.");
                discard();
                setDeleting(undefined);
                onChanged();
            } else {
                notifyError(errorMessage(result.right.value));
            }
        } catch {
            notifyError();
        } finally {
            setBusy(false);
        }
    }

    function save(): void {
        const iban = form.iban.replace(/\s/g, "").toUpperCase();
        const validity = new Date(form.validity_date);
        const due = new Date(form.due_date);
        if (!isValidIBAN(iban)) {
            notifyError("Inserire un IBAN valido.");
            return;
        }
        if (!Number.isFinite(validity.getTime()) || !Number.isFinite(due.getTime()) || due <= validity) {
            notifyError("Inserire date valide: la scadenza deve essere successiva alla validit\u00e0.");
            return;
        }
        const decoded = IbanEnhanced.decode({
            ...form,
            iban,
            ci_owner: code,
            publication_date: new Date().toISOString(),
            validity_date: validity.toISOString(),
            due_date: due.toISOString()
        });
        if (isLeft(decoded) || form.description.length > 300) {
            notifyError("Verificare i dati dell'IBAN.");
            return;
        }
        void persist(decoded.right);
    }

    function confirmDeletion(status: string): void {
        if (busy) {
            return;
        }
        if (status === "ok" && deleting) {
            void persist(deleting);
        } else {
            setDeleting(undefined);
        }
    }

    return (
      <Card>
        <Card.Header>
          <h5>Iban</h5>
        </Card.Header>
        <Card.Body>
          {ibans.length === 0 ? (
            <Alert variant="warning">
              <FaInfoCircle className="mr-1" />
              Iban non presenti
            </Alert>
          ) : (
            <Table hover responsive size="sm">
              <thead>
                <tr>
                  <th>Iban</th>
                  <th>Validit&agrave;</th>
                  <th>Pubblicazione</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ibans.map((item, index) => (
                  <tr key={item.iban || index}>
                    <td>{item.iban}</td>
                    <td>{item.validity_date?.toLocaleDateString() || "-"}</td>
                    <td>
                      {item.publication_date?.toLocaleDateString() || "-"}
                    </td>
                    <td className="text-right">
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip id={`tooltip-iban-delete-${index}`}>
                            Elimina
                          </Tooltip>
                        }
                      >
                        <FaTrash
                          role="button"
                          className="mr-3"
                          onClick={() => setDeleting(item.iban)}
                        />
                      </OverlayTrigger>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {creating && (
            <fieldset disabled={busy}>
              <div className="row">
                <Form.Group controlId="iban-value" className="col-md-6">
                  <Form.Label>IBAN</Form.Label>
                  <Form.Control
                    required
                    maxLength={35}
                    value={form.iban}
                    onChange={event =>
                      setForm({ ...form, iban: event.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group controlId="iban-description" className="col-md-6">
                  <Form.Label>Descrizione</Form.Label>
                  <Form.Control
                    maxLength={300}
                    value={form.description}
                    onChange={event =>
                      setForm({ ...form, description: event.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group controlId="iban-validity" className="col-md-6">
                  <Form.Label>Validit&agrave;</Form.Label>
                  <Form.Control
                    required
                    type="datetime-local"
                    value={form.validity_date}
                    onChange={event =>
                      setForm({ ...form, validity_date: event.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group controlId="iban-due" className="col-md-6">
                  <Form.Label>Scadenza</Form.Label>
                  <Form.Control
                    required
                    type="datetime-local"
                    value={form.due_date}
                    onChange={event =>
                      setForm({ ...form, due_date: event.target.value })
                    }
                  />
                </Form.Group>
              </div>
              <Form.Check
                id="iban-active"
                label="Attivo"
                checked={form.is_active}
                onChange={event =>
                  setForm({ ...form, is_active: event.target.checked })
                }
              />
            </fieldset>
          )}
        </Card.Body>
        <Card.Footer>
          {creating ? (
            <div className="text-right">
              <Button disabled={busy} onClick={() => save()}>
                Salva
              </Button>
              <Button
                className="ml-2"
                variant="secondary"
                disabled={busy}
                onClick={() => discard()}
              >
                Annulla
              </Button>
            </div>
          ) : (
            <Button
              className={"float-md-right"}
              disabled={busy || !!deleting}
              onClick={() => setCreating(true)}
            >
              <FaPlus className="mr-2" />
              Aggiungi
            </Button>
          )}
        </Card.Footer>
        <ConfirmationModal
          show={!!deleting}
          handleClose={(status: string) => confirmDeletion(status)}
        >
          Sei sicuro di voler eliminare il seguente IBAN?
          <p className="font-weight-bold">{deleting}</p>
          {busy && <span role="status">Operazione in corso...</span>}
        </ConfirmationModal>
      </Card>
    );
}
