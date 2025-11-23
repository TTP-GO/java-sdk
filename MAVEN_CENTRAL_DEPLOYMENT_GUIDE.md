# Maven Central Deployment Guide

Complete guide for deploying `ttp-agent-sdk-java` to Maven Central (Sonatype OSSRH).

## Prerequisites

### 1. Sonatype JIRA Account

1. **Create account**: https://issues.sonatype.org/secure/Signup!default.jspa
2. **Create ticket**: https://issues.sonatype.org/secure/CreateIssue.jspa?issuetype=21&pid=10134
   - **Group Id**: `com.talktopc` (or your domain)
   - **Project URL**: `https://github.com/yinon11/ttp-agent-sdk-java`
   - **SCM URL**: `https://github.com/yinon11/ttp-agent-sdk-java.git`
   - **Description**: "TTP Agent SDK for Java - Backend WebSocket SDK for TTP Agent API"

3. **Wait for approval** (usually 1-2 business days)
   - Sonatype will verify domain ownership
   - You'll receive confirmation email

### 2. GPG Key Setup

GPG keys are required to sign artifacts for Maven Central.

#### Install GPG

**Linux/Mac:**
```bash
# Usually pre-installed, or:
sudo apt-get install gnupg  # Ubuntu/Debian
brew install gnupg          # macOS
```

**Windows:**
- Download from: https://www.gpg4win.org/

#### Generate GPG Key

```bash
# Generate key (use your email)
gpg --gen-key

# Choose:
# 1. RSA and RSA (default)
# 2. 4096 bits
# 3. Key valid for: 0 (does not expire)
# 4. Enter your name and email
# 5. Enter passphrase (remember this!)

# List your keys
gpg --list-keys

# Export public key (replace YOUR_KEY_ID)
gpg --armor --export YOUR_KEY_ID > public-key.asc

# Upload to keyserver
gpg --keyserver keyserver.ubuntu.com --send-keys YOUR_KEY_ID
gpg --keyserver keys.openpgp.org --send-keys YOUR_KEY_ID
```

**Get your key ID:**
```bash
gpg --list-keys
# Look for line like: pub   rsa4096 2024-01-01 [SC]
#                    ABC123DEF4567890...  <- This is your key ID
```

## Project Setup

### 1. Update pom.xml

Add Maven Central deployment configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.talktopc</groupId>
    <artifactId>ttp-agent-sdk-java</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>TTP Agent SDK - Java</name>
    <description>Backend SDK for TTP Agent WebSocket API - Supports format negotiation and audio streaming (PCMU/PCMA) for phone systems</description>
    <url>https://github.com/yinon11/ttp-agent-sdk-java</url>

    <licenses>
        <license>
            <name>MIT License</name>
            <url>https://opensource.org/licenses/MIT</url>
            <distribution>repo</distribution>
        </license>
    </licenses>

    <developers>
        <developer>
            <id>yinon11</id>
            <name>TTP Agent Team</name>
            <email>your-email@example.com</email>
        </developer>
    </developers>

    <scm>
        <connection>scm:git:git://github.com/yinon11/ttp-agent-sdk-java.git</connection>
        <developerConnection>scm:git:ssh://github.com/yinon11/ttp-agent-sdk-java.git</developerConnection>
        <url>https://github.com/yinon11/ttp-agent-sdk-java</url>
        <tag>HEAD</tag>
    </scm>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    </properties>

    <dependencies>
        <!-- WebSocket Client -->
        <dependency>
            <groupId>org.glassfish.tyrus</groupId>
            <artifactId>tyrus-client</artifactId>
            <version>2.1.3</version>
        </dependency>
        
        <!-- JSON Processing -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
        
        <!-- SLF4J for Logging -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.9</version>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Compiler Plugin -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                    <encoding>UTF-8</encoding>
                </configuration>
            </plugin>

            <!-- Source JAR -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-source-plugin</artifactId>
                <version>3.3.0</version>
                <executions>
                    <execution>
                        <id>attach-sources</id>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- Javadoc JAR -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-javadoc-plugin</artifactId>
                <version>3.6.0</version>
                <configuration>
                    <source>11</source>
                    <encoding>UTF-8</encoding>
                    <charset>UTF-8</charset>
                    <docencoding>UTF-8</docencoding>
                    <additionalOptions>
                        <additionalOption>-Xdoclint:none</additionalOption>
                    </additionalOptions>
                </configuration>
                <executions>
                    <execution>
                        <id>attach-javadocs</id>
                        <goals>
                            <goal>jar</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- GPG Signing -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-gpg-plugin</artifactId>
                <version>3.0.1</version>
                <executions>
                    <execution>
                        <id>sign-artifacts</id>
                        <phase>verify</phase>
                        <goals>
                            <goal>sign</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- Nexus Staging Plugin (for Maven Central) -->
            <plugin>
                <groupId>org.sonatype.central</groupId>
                <artifactId>central-publishing-maven-plugin</artifactId>
                <version>0.5.0</version>
                <extensions>true</extensions>
                <configuration>
                    <publishingServerId>central</publishingServerId>
                    <autoPublish>true</autoPublish>
                    <waitUntil>published</waitUntil>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <!-- Distribution Management -->
    <distributionManagement>
        <snapshotRepository>
            <id>ossrh</id>
            <name>OSSRH Snapshots</name>
            <url>https://s01.oss.sonatype.org/content/repositories/snapshots</url>
        </snapshotRepository>
        <repository>
            <id>central</id>
            <name>Maven Central</name>
            <url>https://s01.oss.sonatype.org/service/local/staging/deploy/maven2/</url>
        </repository>
    </distributionManagement>

    <!-- Profiles -->
    <profiles>
        <profile>
            <id>release</id>
            <build>
                <plugins>
                    <!-- Nexus Staging Plugin -->
                    <plugin>
                        <groupId>org.sonatype.central</groupId>
                        <artifactId>central-publishing-maven-plugin</artifactId>
                        <version>0.5.0</version>
                        <extensions>true</extensions>
                        <configuration>
                            <publishingServerId>central</publishingServerId>
                            <autoPublish>true</autoPublish>
                            <waitUntil>published</waitUntil>
                        </configuration>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
</project>
```

### 2. Create settings.xml

Create `~/.m2/settings.xml` (or `%USERPROFILE%\.m2\settings.xml` on Windows):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
          http://maven.apache.org/xsd/settings-1.0.0.xsd">
    <servers>
        <server>
            <id>central</id>
            <username>YOUR_SONATYPE_USERNAME</username>
            <password>YOUR_SONATYPE_PASSWORD</password>
        </server>
        <server>
            <id>ossrh</id>
            <username>YOUR_SONATYPE_USERNAME</username>
            <password>YOUR_SONATYPE_PASSWORD</password>
        </server>
    </servers>
</settings>
```

**Security Note:** Never commit `settings.xml` to git! It contains credentials.

### 3. Add GPG Configuration (Optional)

If you want to avoid entering GPG passphrase each time, add to `settings.xml`:

```xml
<profiles>
    <profile>
        <id>gpg</id>
        <properties>
            <gpg.executable>gpg</gpg.executable>
            <gpg.passphrase>YOUR_GPG_PASSPHRASE</gpg.passphrase>
        </properties>
    </profile>
</profiles>
<activeProfiles>
    <activeProfile>gpg</activeProfile>
</activeProfiles>
```

**Security Warning:** This stores passphrase in plain text. Use only on secure machines.

## Deployment Process

### Step 1: Prepare Release

```bash
# Clean and verify
mvn clean verify

# Run tests
mvn test

# Check what will be deployed
mvn deploy -DdryRun=true
```

### Step 2: Deploy to Staging

```bash
# Deploy to Sonatype staging repository
mvn clean deploy -Prelease

# Or use the new central publishing plugin (recommended)
mvn clean deploy
```

**What happens:**
1. Maven builds project
2. Creates JAR, sources JAR, javadoc JAR
3. Signs all artifacts with GPG
4. Uploads to Sonatype staging repository
5. Auto-publishes to Maven Central (if `autoPublish=true`)

### Step 3: Verify Deployment

1. **Check Sonatype Nexus:**
   - Go to: https://s01.oss.sonatype.org/
   - Login with Sonatype credentials
   - Check "Staging Repositories"
   - Find your repository (e.g., `comtalktopc-1000`)

2. **Verify artifacts:**
   - Should see: `ttp-agent-sdk-java-1.0.0.jar`
   - Should see: `ttp-agent-sdk-java-1.0.0-sources.jar`
   - Should see: `ttp-agent-sdk-java-1.0.0-javadoc.jar`
   - Should see: `.asc` files (GPG signatures)

3. **Close and Release:**
   - If using old Nexus plugin: Click "Close" → "Release"
   - If using new plugin: Auto-publishes (check logs)

### Step 4: Wait for Sync

- **Staging → Central**: Usually 10-30 minutes
- **Central → Search**: Usually 2-4 hours

### Step 5: Verify on Maven Central

Check: https://search.maven.org/search?q=g:com.talktopc%20AND%20a:ttp-agent-sdk-java

## Alternative: Using GitHub Actions (CI/CD)

### Create `.github/workflows/deploy.yml`

```yaml
name: Deploy to Maven Central

on:
  release:
    types: [created]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 11
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
      
      - name: Configure GPG
        env:
          GPG_PRIVATE_KEY: ${{ secrets.GPG_PRIVATE_KEY }}
          GPG_PASSPHRASE: ${{ secrets.GPG_PASSPHRASE }}
        run: |
          echo "$GPG_PRIVATE_KEY" | gpg --batch --import
          gpg --list-keys
      
      - name: Deploy to Maven Central
        env:
          OSSRH_USERNAME: ${{ secrets.OSSRH_USERNAME }}
          OSSRH_PASSWORD: ${{ secrets.OSSRH_PASSWORD }}
        run: |
          mvn clean deploy -Prelease
```

### GitHub Secrets Setup

Add these secrets to your GitHub repository:

1. **GPG_PRIVATE_KEY**: Export with `gpg --armor --export-secret-keys YOUR_KEY_ID`
2. **GPG_PASSPHRASE**: Your GPG passphrase
3. **OSSRH_USERNAME**: Sonatype username
4. **OSSRH_PASSWORD**: Sonatype password

## Troubleshooting

### Issue: "GPG signing failed"

**Solution:**
```bash
# Make sure GPG is installed and key is available
gpg --list-keys

# Test signing
echo "test" | gpg --clearsign

# If passphrase prompt doesn't work, add to settings.xml (see above)
```

### Issue: "401 Unauthorized"

**Solution:**
- Check `settings.xml` credentials
- Verify Sonatype account is approved
- Make sure you're using correct server ID (`central` or `ossrh`)

### Issue: "Repository not found"

**Solution:**
- Wait for Sonatype approval (check JIRA ticket)
- Verify group ID matches approved domain
- Check ticket status: https://issues.sonatype.org/

### Issue: "Artifact already exists"

**Solution:**
- Version already published - use new version number
- Check: https://search.maven.org/search?q=g:com.talktopc

## Version Management

### Snapshot Versions

```xml
<version>1.0.0-SNAPSHOT</version>
```

- Deploys to: `https://s01.oss.sonatype.org/content/repositories/snapshots`
- Can be overwritten
- Use for development/testing

### Release Versions

```xml
<version>1.0.0</version>
```

- Deploys to: Maven Central (permanent)
- Cannot be overwritten
- Use for production releases

### Versioning Best Practices

- **Major.Minor.Patch** (Semantic Versioning)
- **1.0.0** - Initial release
- **1.0.1** - Bug fixes
- **1.1.0** - New features (backward compatible)
- **2.0.0** - Breaking changes

## Quick Reference

### Deploy Snapshot
```bash
mvn clean deploy
# Version must end with -SNAPSHOT
```

### Deploy Release
```bash
# Update version in pom.xml (remove -SNAPSHOT)
mvn clean deploy -Prelease
```

### Skip Tests (if needed)
```bash
mvn clean deploy -DskipTests
```

### Dry Run (test without deploying)
```bash
mvn deploy -DdryRun=true
```

## Checklist

Before deploying:

- [ ] Sonatype JIRA ticket approved
- [ ] GPG key generated and uploaded
- [ ] `settings.xml` configured with credentials
- [ ] `pom.xml` has all required metadata
- [ ] Tests pass: `mvn test`
- [ ] Javadoc generates: `mvn javadoc:jar`
- [ ] Sources JAR generates: `mvn source:jar`
- [ ] Version number updated (no -SNAPSHOT for release)
- [ ] Git tag created: `git tag v1.0.0`
- [ ] README.md updated with Maven coordinates

## After Deployment

### Update Documentation

Add Maven dependency to README:

```markdown
## Installation

### Maven

```xml
<dependency>
    <groupId>com.talktopc</groupId>
    <artifactId>ttp-agent-sdk-java</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Gradle

```gradle
dependencies {
    implementation 'com.talktopc:ttp-agent-sdk-java:1.0.0'
}
```
```

### Verify Availability

Check Maven Central search:
- https://search.maven.org/search?q=g:com.talktopc

## Summary

**Deployment Steps:**

1. ✅ Create Sonatype account & get approval
2. ✅ Generate GPG key & upload to keyserver
3. ✅ Configure `pom.xml` with Maven Central settings
4. ✅ Configure `settings.xml` with credentials
5. ✅ Build & test: `mvn clean verify`
6. ✅ Deploy: `mvn clean deploy -Prelease`
7. ✅ Wait for sync (10-30 min staging, 2-4 hours search)
8. ✅ Verify on Maven Central

**Key Files:**
- `pom.xml` - Project configuration
- `~/.m2/settings.xml` - Credentials (never commit!)
- GPG key - For signing artifacts

This will make your Java SDK available to all Maven/Gradle users worldwide! 🚀

