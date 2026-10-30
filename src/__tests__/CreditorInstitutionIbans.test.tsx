import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import CreditorInstitutionIbans from "../pages/creditorInstitutions/CreditorInstitutionIbans";
import { apiClient } from "../util/apiClient";

const acquireTokenSilent = jest.fn();
jest.mock("@azure/msal-react", () => ({
    useMsal: () => ({ instance: { acquireTokenSilent }, accounts: [{ username: "test" }] })
}));
jest.mock("../util/apiClient", () => ({
    apiClient: {
        createCreditorInstitutionsIbans: jest.fn(),
        deleteCreditorInstitutionsIban: jest.fn()
    }
}));
jest.mock("react-toastify", () => ({
    toast: { info: jest.fn(), error: jest.fn() }
}));

const iban = "IT60X0542811101000000123456";
const onChanged = jest.fn();
const createIban = apiClient.createCreditorInstitutionsIbans as jest.Mock;
const deleteIban = apiClient.deleteCreditorInstitutionsIban as jest.Mock;

function renderCard() {
    return render(<CreditorInstitutionIbans
        code="15376371009"
        ibans={[{ iban }]}
        onChanged={onChanged}
    />);
}

function fillForm(value = iban) {
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi/ }));
    fireEvent.change(screen.getByLabelText("IBAN"), { target: { value } });
    fireEvent.change(screen.getByLabelText("Descrizione"), { target: { value: "Tributi" } });
    fireEvent.change(screen.getByLabelText("Validit\u00e0"), { target: { value: "2026-10-30T12:00" } });
    fireEvent.change(screen.getByLabelText("Scadenza"), { target: { value: "2027-10-30T12:00" } });
}

beforeEach(() => {
    jest.clearAllMocks();
    acquireTokenSilent.mockResolvedValue({ accessToken: "test-token" });
    createIban.mockResolvedValue({ _tag: "Right", right: { status: 201 } });
    deleteIban.mockResolvedValue({ _tag: "Right", right: { status: 200 } });
});

test("creates an IBAN with the endpoint payload and refreshes the list", async () => {
    renderCard();
    fillForm("it60 x054 2811 1010 0000 0123 456");
    fireEvent.click(screen.getByLabelText("Attivo"));
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(createIban).toHaveBeenCalledWith({
        Authorization: "Bearer test-token",
        ApiKey: "",
        creditorinstitutioncode: "15376371009",
        body: expect.objectContaining({
            iban,
            ci_owner: "15376371009",
            description: "Tributi",
            is_active: false,
            validity_date: new Date("2026-10-30T12:00"),
            due_date: new Date("2027-10-30T12:00"),
            publication_date: expect.any(Date)
        })
    });
    expect(screen.queryByRole("button", { name: "Salva" })).not.toBeInTheDocument();
});

test.each([
    ["invalid IBAN", "IT00INVALID", "2027-10-30T12:00"],
    ["expiry before validity", iban, "2025-10-30T12:00"],
    ["missing expiry", iban, ""]
])("rejects %s without sending a request", (_name, value, expiry) => {
    renderCard();
    fillForm(value);
    fireEvent.change(screen.getByLabelText("Scadenza"), { target: { value: expiry } });
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    expect(createIban).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
});

test("cancels insertion without changing the IBAN list", () => {
    renderCard();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Annulla" }));
    expect(screen.queryByLabelText("IBAN")).not.toBeInTheDocument();
    expect(screen.getByText(iban)).toBeInTheDocument();
    expect(createIban).not.toHaveBeenCalled();
});

test("deletes only after confirmation and refreshes the list", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: `Elimina ${iban}` }));
    expect(deleteIban).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(deleteIban).toHaveBeenCalledWith({
        Authorization: "Bearer test-token", ApiKey: "",
        creditorinstitutioncode: "15376371009", ibanValue: iban
    });
});

test("cancels deletion without calling the API", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: `Elimina ${iban}` }));
    fireEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    expect(deleteIban).not.toHaveBeenCalled();
});

test("preserves input and displays the backend error on rejected creation", async () => {
    createIban.mockResolvedValue({ _tag: "Right", right: { status: 409, value: { detail: "IBAN esistente" } } });
    renderCard();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("IBAN esistente", { theme: "colored" }));
    expect(screen.getByLabelText("IBAN")).toHaveValue(iban);
    expect(onChanged).not.toHaveBeenCalled();
});

test.each([
    { _tag: "Left", left: [] },
    { _tag: "Right", right: { status: 401 } }
])("reports decoding and bodyless API failures", async response => {
    createIban.mockResolvedValue(response);
    renderCard();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salva" })).toBeEnabled();
});

test("reports authentication failures and allows retry", async () => {
    acquireTokenSilent.mockRejectedValue(new Error("authentication failed"));
    renderCard();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(createIban).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salva" })).toBeEnabled();
});

test("reports deletion failures without refreshing the list", async () => {
    deleteIban.mockRejectedValue(new Error("network"));
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: `Elimina ${iban}` }));
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getAllByText(iban).length).toBeGreaterThan(0);
});

test("blocks duplicate submissions while authentication is pending", () => {
    acquireTokenSilent.mockImplementationOnce(() => new Promise(() => undefined));
    renderCard();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    fireEvent.click(screen.getByRole("button", { name: "Salva" }));
    expect(acquireTokenSilent).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Salva" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Annulla" })).toBeDisabled();
});

test("blocks duplicate delete confirmations while authentication is pending", () => {
    acquireTokenSilent.mockImplementationOnce(() => new Promise(() => undefined));
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: `Elimina ${iban}` }));
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    expect(acquireTokenSilent).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Operazione in corso");
});

test("shows backend deletion errors and permits retry", async () => {
    deleteIban.mockResolvedValueOnce({ _tag: "Right", right: { status: 400, value: { detail: "IBAN non eliminabile" } } });
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: `Elimina ${iban}` }));
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("IBAN non eliminabile", { theme: "colored" }));
    expect(onChanged).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Conferma" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
});

test("allows insertion with an empty list", () => {
    render(<CreditorInstitutionIbans code="15376371009" ibans={[]} onChanged={onChanged} />);
    expect(screen.getByText("Iban non presenti")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi/ }));
    expect(screen.getByLabelText("IBAN")).toBeInTheDocument();
});

test("preserves the display of validity and publication dates", () => {
    const validity = new Date("2026-10-30T12:00:00Z");
    const publication = new Date("2026-10-29T12:00:00Z");
    render(<CreditorInstitutionIbans code="15376371009"
        ibans={[{ iban, validity_date: validity, publication_date: publication }]}
        onChanged={onChanged} />);
    expect(screen.getByText(validity.toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText(publication.toLocaleDateString())).toBeInTheDocument();
});
