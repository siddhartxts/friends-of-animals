import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormAlert, SubmitButton, TextField } from "./index";

describe("<TextField>", () => {
  it("labels its input", () => {
    const html = renderToStaticMarkup(
      <TextField id="email" name="email" type="email" label="Email address" />
    );
    expect(html).toContain('<label for="email"');
    expect(html).toMatch(/<input[^>]* id="email"[^>]* name="email"/);
    expect(html).toContain("Email address");
  });

  it("points the input at its hint", () => {
    const html = renderToStaticMarkup(
      <TextField id="email" name="email" label="Email" hint="We send a code" />
    );
    expect(html).toMatch(/<input[^>]* aria-describedby="email-hint"/);
    expect(html).toMatch(/id="email-hint"[^>]*>We send a code</);
    expect(html).not.toMatch(/ aria-invalid="/);
  });

  it("marks the input invalid and points it at the error", () => {
    const html = renderToStaticMarkup(
      <TextField
        id="email"
        name="email"
        label="Email"
        hint="We send a code"
        error="Enter an email address"
      />
    );
    expect(html).toMatch(/<input[^>]* aria-invalid="true"/);
    expect(html).toMatch(/aria-describedby="email-hint email-error"/);
    expect(html).toMatch(/id="email-error"[^>]*>.*Enter an email address/);
  });

  it("keeps its hint and error when the caller adds a description", () => {
    const html = renderToStaticMarkup(
      <TextField
        id="email"
        name="email"
        label="Email"
        hint="We send a code"
        error="Enter an email address"
        aria-describedby="email-policy"
      />
    );
    expect(html).toMatch(
      /<input[^>]* aria-describedby="email-policy email-hint email-error"/
    );
  });

  it("stays invalid while it shows an error, whatever the caller passes", () => {
    const html = renderToStaticMarkup(
      <TextField
        id="email"
        name="email"
        label="Email"
        error="Enter an email address"
        aria-invalid={false}
      />
    );
    expect(html).toMatch(/<input[^>]* aria-invalid="true"/);
  });

  it("passes input attributes through", () => {
    const html = renderToStaticMarkup(
      <TextField
        id="code"
        name="code"
        label="Code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
      />
    );
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('autoComplete="one-time-code"');
    expect(html).toContain('required=""');
  });
});

describe("<FormAlert>", () => {
  it("announces a problem with an icon and a word, not colour alone", () => {
    const html = renderToStaticMarkup(
      <FormAlert tone="danger" label="Important">
        Too many codes. Try again in 15 minutes.
      </FormAlert>
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("<svg");
    expect(html).toContain("Important");
    expect(html).toContain("Too many codes. Try again in 15 minutes.");
  });

  it("reports good news politely", () => {
    const html = renderToStaticMarkup(
      <FormAlert tone="success" label="Done">
        We sent a code.
      </FormAlert>
    );
    expect(html).toContain('role="status"');
  });
});

describe("<SubmitButton>", () => {
  it("submits its form", () => {
    const html = renderToStaticMarkup(
      <SubmitButton pendingLabel="Sending…">Send code</SubmitButton>
    );
    expect(html).toMatch(/<button[^>]* type="submit"/);
    expect(html).toContain("Send code");
    expect(html).not.toMatch(/ disabled=""/);
  });
});
