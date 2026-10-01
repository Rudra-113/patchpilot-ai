from app.schemas.api import Analysis, Finding, FixProposal

SQL_BEFORE = 'query = "SELECT * FROM users WHERE id=" + user_id\ncursor.execute(query)'
SQL_AFTER = 'query = "SELECT * FROM users WHERE id = ?"\ncursor.execute(query, (user_id,))'


def _analysis(summary: str, root: str, vector: str, impact: str, remediation: str) -> Analysis:
    return Analysis(
        summary=summary,
        root_cause=root,
        attack_vector=vector,
        security_impact=impact,
        recommended_remediation=remediation,
        source="demo",
    )


def _fix(summary: str, explanation: str, before: str, after: str, file: str) -> FixProposal:
    return FixProposal(
        summary=summary,
        explanation=explanation,
        before=before,
        after=after,
        file=file,
        source="demo",
    )


_CATALOG: list[dict[str, object]] = [
    {
        "key": "finding-001",
        "severity": "critical",
        "title": "SQL Injection",
        "scanner": "Semgrep",
        "file": "app/database.py",
        "line": 42,
        "cwe": "CWE-89",
        "description": "The application constructs a SQL query by concatenating unsanitized user-controlled input into the statement.",
        "why": "An attacker who controls user_id can change which rows the query reads or writes.",
        "code": SQL_BEFORE,
        "analysis": _analysis(
            "The application constructs a SQL query using unsanitized user-controlled input. An attacker could manipulate the user_id parameter to alter the SQL statement.",
            "user_id is concatenated into the SQL string before the driver ever sees a parameter.",
            "A request that supplies user_id can include SQL syntax that changes the statement structure.",
            "The database may return, change, or delete rows outside the one the view was written to touch.",
            "Keep the statement text fixed and pass user_id as a bound parameter.",
        ),
        "fix": _fix(
            "Bind the user id as a query parameter.",
            "The statement text no longer changes with the request. The driver sends user_id as data, and the selected columns stay the same.",
            SQL_BEFORE,
            SQL_AFTER,
            "app/database.py",
        ),
    },
    {
        "key": "finding-002",
        "severity": "critical",
        "title": "Hardcoded Secret",
        "scanner": "Gitleaks",
        "file": "app/config.py",
        "line": 18,
        "cwe": "CWE-798",
        "description": "A cloud API credential is stored directly in source that is part of the repository tree.",
        "why": "Anyone who can read the repository can reuse the credential, including from old clones.",
        "code": 'AWS_SECRET = "demo-secret-not-a-real-credential"',
        "analysis": _analysis(
            "The credential is a literal in source control rather than a value supplied by the environment at runtime.",
            "The secret was committed beside the code that uses it.",
            "Reading the repository, or any fork of it, reveals the credential.",
            "The cloud account can be used outside this application until the credential is revoked.",
            "Read the secret from the environment and rotate the value that was committed.",
        ),
        "fix": _fix(
            "Load the credential from the environment.",
            "The source no longer contains the secret. Deployments must provide AWS_SECRET_ACCESS_KEY instead.",
            'AWS_SECRET = "demo-secret-not-a-real-credential"',
            'AWS_SECRET = os.environ["AWS_SECRET_ACCESS_KEY"]',
            "app/config.py",
        ),
    },
    {
        "key": "finding-003",
        "severity": "high",
        "title": "Command Injection",
        "scanner": "Bandit",
        "file": "app/archive.py",
        "line": 27,
        "cwe": "CWE-78",
        "description": "A shell command is built from an unsanitized filename and passed to the operating system shell.",
        "why": "Shell metacharacters in the filename can run additional commands with the application's privileges.",
        "code": 'os.system("tar xf " + filename)',
        "analysis": _analysis(
            "The filename is inserted into a string that the shell parses, so the filename is not limited to being an argument.",
            "os.system sends the whole string through the shell.",
            "A filename containing shell syntax can append commands to the tar invocation.",
            "Those commands run as the service account and can read or modify anything that account can touch.",
            "Call tar with an argument list and do not invoke a shell.",
        ),
        "fix": _fix(
            "Pass the filename as one argument.",
            "tar receives the filename as a single argv element. Shell metacharacters stay inside that argument.",
            'os.system("tar xf " + filename)',
            'subprocess.run(["tar", "xf", filename], check=True)',
            "app/archive.py",
        ),
    },
    {
        "key": "finding-004",
        "severity": "high",
        "title": "Weak Cryptography",
        "scanner": "Bandit",
        "file": "app/auth/tokens.py",
        "line": 15,
        "cwe": "CWE-327",
        "description": "Password-reset tokens are derived with MD5, which is not a collision-resistant hash.",
        "why": "A token that can be predicted or collided lets someone else consume a reset that was not meant for them.",
        "code": "token = hashlib.md5(email.encode()).hexdigest()",
        "analysis": _analysis(
            "The reset token is an MD5 digest of the email address, so it is neither random nor a strong hash.",
            "The token is a pure function of data the attacker often already knows.",
            "Requesting a reset, or simply knowing the email, reveals the token value.",
            "The account recovery flow can be completed by someone other than the mailbox owner.",
            "Generate a random token with secrets.token_urlsafe and store only a strong hash of it.",
        ),
        "fix": _fix(
            "Use a random token.",
            "The token no longer depends on the email address. MD5 is removed from the reset flow.",
            "token = hashlib.md5(email.encode()).hexdigest()",
            "token = secrets.token_urlsafe(32)",
            "app/auth/tokens.py",
        ),
    },
    {
        "key": "finding-005",
        "severity": "high",
        "title": "Vulnerable Dependency",
        "scanner": "pip-audit",
        "file": "requirements.txt",
        "line": 4,
        "cwe": "CWE-1395",
        "description": "PyYAML 5.3.1 is pinned and is flagged for CVE-2020-14343, an unsafe loader issue in that release line.",
        "why": "Loading untrusted YAML with the vulnerable loader can execute code in the process that parses the document.",
        "code": "PyYAML==5.3.1",
        "analysis": _analysis(
            "The dependency pin selects a PyYAML release affected by CVE-2020-14343.",
            "The application trusts a library version with a known unsafe load path.",
            "Untrusted YAML that reaches the loader is the input the advisory describes.",
            "Code can run inside the worker that parses the document.",
            "Pin PyYAML to 6.0.1 or newer and load documents with SafeLoader.",
        ),
        "fix": _fix(
            "Upgrade the pinned PyYAML release.",
            "The requirements pin moves past the vulnerable 5.3.1 release. Application imports of yaml do not need to change for this bump.",
            "PyYAML==5.3.1",
            "PyYAML==6.0.1",
            "requirements.txt",
        ),
    },
    {
        "key": "finding-006",
        "severity": "medium",
        "title": "Path Traversal",
        "scanner": "Semgrep",
        "file": "app/files.py",
        "line": 61,
        "cwe": "CWE-22",
        "description": "A user-supplied path is joined onto the upload directory without checking that the result stays inside that directory.",
        "why": "Parent-directory segments can read files outside the folder this feature is allowed to serve.",
        "code": "return open(os.path.join(UPLOAD_DIR, name)).read()",
        "analysis": _analysis(
            "os.path.join does not reject a name that climbs out of UPLOAD_DIR.",
            "The joined path is opened with no containment check.",
            "A name such as a parent-directory sequence points the open() call elsewhere on disk.",
            "Files outside the upload folder can be returned to the requester.",
            "Resolve the path and require it to stay under UPLOAD_DIR.",
        ),
        "fix": _fix(
            "Reject paths that leave the upload directory.",
            "The file is opened only when the resolved path is still inside UPLOAD_DIR.",
            "return open(os.path.join(UPLOAD_DIR, name)).read()",
            "path = (UPLOAD_DIR / name).resolve()\npath.relative_to(UPLOAD_DIR.resolve())\nreturn path.read_text()",
            "app/files.py",
        ),
    },
    {
        "key": "finding-007",
        "severity": "medium",
        "title": "Insecure Deserialization",
        "scanner": "Bandit",
        "file": "app/workers/queue.py",
        "line": 44,
        "cwe": "CWE-502",
        "description": "Worker payloads are restored with pickle from data that did not originate inside this process.",
        "why": "Pickle can run code while an object is reconstructed.",
        "code": "job = pickle.loads(payload)",
        "analysis": _analysis(
            "pickle.loads trusts the bytes it is given and can invoke code during reconstruction.",
            "The queue treats an untrusted payload as a native object graph.",
            "Anyone who can publish to the queue can supply a pickle payload.",
            "The worker process can be made to run that payload's code.",
            "Accept JSON objects only, and reject binary pickle payloads.",
        ),
        "fix": _fix(
            "Decode the payload as JSON.",
            "The worker now accepts a data document. Pickle is no longer on this path.",
            "job = pickle.loads(payload)",
            "job = json.loads(payload)",
            "app/workers/queue.py",
        ),
    },
    {
        "key": "finding-008",
        "severity": "medium",
        "title": "Reflected Cross-Site Scripting",
        "scanner": "Semgrep",
        "file": "app/views/profile.py",
        "line": 33,
        "cwe": "CWE-79",
        "description": "A query parameter is written into an HTML response without encoding.",
        "why": "A crafted link can run script in the victim's browser with that user's session.",
        "code": 'return f"<h1>{name}</h1>"',
        "analysis": _analysis(
            "The name parameter is interpolated into HTML as markup, not as text.",
            "The template string does not encode characters that HTML treats as tags.",
            "A link that puts markup in the name parameter is enough to plant that markup in the response.",
            "Script in that response runs with the privileges of the person who opens the link.",
            "HTML-encode the name before inserting it.",
        ),
        "fix": _fix(
            "Encode the name before it reaches the HTML.",
            "The heading still renders the visitor's name, and markup in that value is shown as text.",
            'return f"<h1>{name}</h1>"',
            'return f"<h1>{html.escape(name)}</h1>"',
            "app/views/profile.py",
        ),
    },
    {
        "key": "finding-009",
        "severity": "medium",
        "title": "Debug Mode Enabled",
        "scanner": "Semgrep",
        "file": "app/settings.py",
        "line": 9,
        "cwe": "CWE-489",
        "description": "The application configuration enables the interactive debugger in the runtime settings module.",
        "why": "A debugger exposed beyond local development can leak source, environment, and request data.",
        "code": "DEBUG = True",
        "analysis": _analysis(
            "DEBUG is hard-coded on, so the debugger policy does not follow the environment.",
            "The setting lives in source that every deployment imports.",
            "A deployed instance uses the same flag as a laptop.",
            "Interactive debug output can expose secrets and source to anyone who can trigger an error.",
            "Default the flag off and allow it only through an explicit environment variable.",
        ),
        "fix": _fix(
            "Default debug mode to off.",
            "Production stays off unless APP_DEBUG is set to true for a local session.",
            "DEBUG = True",
            'DEBUG = os.environ.get("APP_DEBUG", "false").lower() == "true"',
            "app/settings.py",
        ),
    },
    {
        "key": "finding-010",
        "severity": "low",
        "title": "Container Runs as Root",
        "scanner": "Trivy",
        "file": "Dockerfile",
        "line": 1,
        "cwe": "CWE-250",
        "description": "The image does not declare a non-root user, so the process keeps the default root identity.",
        "why": "A compromise inside the container starts with more filesystem access than the workload needs.",
        "code": "FROM python:3.12-slim",
        "analysis": _analysis(
            "The image has no USER instruction, so the process keeps uid 0.",
            "The Dockerfile never drops privileges after installing dependencies.",
            "An attacker who can run code in the container starts as root inside that namespace.",
            "Writes and package changes are easier than they would be as an unprivileged user.",
            "Create an application user and switch to it before the process starts.",
        ),
        "fix": _fix(
            "Run the container as an unprivileged user.",
            "The base image stays the same. The process no longer starts as root.",
            "FROM python:3.12-slim",
            "FROM python:3.12-slim\nRUN useradd --create-home app\nUSER app",
            "Dockerfile",
        ),
    },
]


def demo_findings(scan_id: str, *, with_analysis: bool) -> list[Finding]:
    findings: list[Finding] = []
    for item in _CATALOG:
        findings.append(
            Finding(
                id=f"{scan_id}-{item['key']}",
                severity=item["severity"],  # type: ignore[arg-type]
                title=str(item["title"]),
                scanner=str(item["scanner"]),
                file=str(item["file"]),
                line=int(item["line"]),  # type: ignore[arg-type]
                status="unfixed",
                description=str(item["description"]),
                why_it_matters=str(item["why"]),
                cwe=str(item["cwe"]),
                code=str(item["code"]),
                analysis=item["analysis"] if with_analysis else None,  # type: ignore[arg-type]
            )
        )
    return findings


def demo_fix_for(finding_id: str) -> FixProposal | None:
    for item in _CATALOG:
        if finding_id.endswith(str(item["key"])):
            fix = item["fix"]
            assert isinstance(fix, FixProposal)
            return fix.model_copy(deep=True)
    return None
