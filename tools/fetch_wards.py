import json
from pathlib import Path
import subprocess


API_URL = "https://provinces.open-api.vn/api/v2/?depth=2"
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "json" / "wards.json"
EXPECTED_PROVINCES = 34


def main():
    response = subprocess.run(
        ["curl", "-fsSL", "--max-time", "30", API_URL],
        capture_output=True,
        text=True,
        check=False,
    )
    if response.returncode != 0:
        raise RuntimeError(f"Could not download ward data: {response.stderr.strip()}")
    provinces = json.loads(response.stdout)

    if not isinstance(provinces, list):
        raise ValueError("API response is not a province list.")
    if len(provinces) != EXPECTED_PROVINCES:
        raise ValueError(
            f"Expected {EXPECTED_PROVINCES} provinces; API returned {len(provinces)}."
        )

    wards_data = []
    total_wards = 0
    for province in provinces:
        if not isinstance(province, dict) or not isinstance(province.get("wards"), list):
            raise ValueError("API response contains a province without a wards list.")

        wards = []
        for ward in province["wards"]:
            if not isinstance(ward, dict) or "code" not in ward or "name" not in ward:
                raise ValueError("API response contains a ward without code or name.")
            wards.append({"code": ward["code"], "name": ward["name"]})

        if "code" not in province or "name" not in province:
            raise ValueError("API response contains a province without code or name.")
        wards_data.append(
            {"code": province["code"], "name": province["name"], "wards": wards}
        )
        total_wards += len(wards)

    if not 3000 <= total_wards <= 3600:
        raise ValueError(f"Unexpected ward count from API: {total_wards}.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = OUTPUT_PATH.with_suffix(".json.tmp")
    temporary_path.write_text(
        json.dumps(wards_data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(OUTPUT_PATH)

    print(f"Provinces: {len(wards_data)}")
    print(f"Wards: {total_wards}")
    print("Sample wards:")
    print(json.dumps(wards_data[0]["wards"][:3], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
