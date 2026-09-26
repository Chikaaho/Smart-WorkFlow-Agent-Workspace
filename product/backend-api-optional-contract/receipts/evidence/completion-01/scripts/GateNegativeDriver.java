import com.sw.ck.bootstrap.architecture.ApiOptionalContractGate;
import com.sw.ck.bootstrap.architecture.fixture.CompliantFacade;
import com.sw.ck.bootstrap.architecture.fixture.CompliantSupport;
import com.sw.ck.bootstrap.architecture.fixture.NonCompliantFacade;
import com.sw.ck.bootstrap.architecture.fixture.NonCompliantSupport;

import java.util.List;
import java.util.Set;

/**
 * 守门反例取证驱动：直接调用编译产物中的 ApiOptionalContractGate（与 JUnit 测试同一实现），
 * 打印每类反例的“实际守门消息”，并复核合规夹具与生产契约的扫描结果。
 * 不修改任何仓库文件；仅读取 classpath 上已编译的守门类与夹具类。
 */
public final class GateNegativeDriver {

    public static void main(String[] args) {
        System.out.println("[driver] gate implementation class: " + ApiOptionalContractGate.class.getName());
        System.out.println("[driver] gate class loaded from: "
                + ApiOptionalContractGate.class.getProtectionDomain().getCodeSource().getLocation());

        printFixture("违规夹具 A：接口方法返回非 Optional / raw / Optional<Void> / 嵌套",
                NonCompliantFacade.class);
        printFixture("违规夹具 B：公开类 public static 方法返回非 Optional", NonCompliantSupport.class);

        System.out.println("---- 合规夹具（应 0 违规）----");
        List<String> compliant = ApiOptionalContractGate.violationsIn(
                List.of(CompliantFacade.class, CompliantSupport.class));
        System.out.println("[driver] compliant fixtures violations=" + compliant.size());

        System.out.println("---- 生产契约扫描（真实 -api 模块产物）----");
        Set<Class<?>> apiTypes = ApiOptionalContractGate.scanApiModuleTypes();
        int methods = ApiOptionalContractGate.contractMethodCount(apiTypes);
        List<String> productionViolations = ApiOptionalContractGate.violationsIn(apiTypes);
        System.out.println("[driver] scanned api types=" + apiTypes.size()
                + " interfaces=" + ApiOptionalContractGate.interfacesOf(apiTypes).size()
                + " contract methods=" + methods);
        System.out.println("[driver] production violations=" + productionViolations.size());
        for (String v : productionViolations) {
            System.out.println("    production-violation: " + v);
        }
    }

    private static void printFixture(String label, Class<?> fixture) {
        List<String> violations = ApiOptionalContractGate.violationsIn(List.of(fixture));
        System.out.println("---- " + label + " ----");
        System.out.println("[driver] fixture=" + fixture.getName() + " violations=" + violations.size());
        for (String v : violations) {
            System.out.println("    actual-gate-message: " + v);
        }
    }
}
