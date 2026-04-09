<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Group;
use App\Models\Profession;
use App\Models\Types_wagon;
use App\Models\Malfunction;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->createAdmin();
        $this->createTypesWagonsAndMalfunctions();
    }

    private function createAdmin()
    {
        try {
            $admin = User::where('login', 'admin')->first();

            if (!$admin) {
                User::create([
                    'login' => 'admin',
                    'password' => Hash::make('admin'),
                    'surname' => 'Администратор',
                    'name' => 'Админ',
                    'patronymic' => 'Админович',
                    'pol' => 'male',
                    'group_id' => null,
                    'profession_id' => null,
                    'role' => true
                ]);
                $this->command->info('Admin user created successfully');
            }
        } catch (\Exception $e) {
            $this->command->error('Error creating admin user: ' . $e->getMessage());
        }
    }

    private function createTypesWagonsAndMalfunctions()
    {
        try {
            $wagonTypes = [
                'Крытый Вагон',
                'Полувагон',
                'Платформа',
                'Цистерна',
                'Вагон хопперного типа'
            ];

            $wagonIds = [];
            foreach ($wagonTypes as $name) {
                $wagon = Types_wagon::firstOrCreate(['name' => $name]);
                $wagonIds[$name] = $wagon->id;
            }

            $malfunctions = [
                'Крытый Вагон' => [
                    'Неисправность дверей',
                    'Неисправность дверных замков',
                    'Неисправность верхних боковых люков',
                    'Вмятины панелей кузова',
                    'Отверстия в панелях кузова',
                    'Прорубы в панелях кузова',
                    'Неисправность торцевых стенок',
                    'Отсутствие (срыв) ЗПУ',
                ],
                'Полувагон' => [
                    'Дефект спойлера',
                    'Неисправность замков люков',
                    'Неисправность лестницы',
                    'Дефект торцевой поверхности',
                    'Верхняя негабаритность',
                ],
                'Платформа' => [
                    'Неисправности боковых стоечных скоб',
                    'Неисправности торцевых стоечных скоб',
                    'Неисправность петель, запоров бортов платформы',
                    'Нарушения крепления груза',
                ],
                'Цистерна' => [
                    'Неисправность лестницы',
                    'Неисправность предохранительных клапанов',
                    'Неисправность настила',
                    'Дефект поверхности котла',
                ],
                'Вагон хопперного типа' => [
                    'Неисправность верхних и нижних загрузочных устройств',
                    'Неисправность наружная деформация',
                    'Отверстия в панелях кузова',
                    'Повреждение ЗПУ',
                ],
            ];

            foreach ($malfunctions as $wagonName => $malfunctionList) {
                $wagonId = $wagonIds[$wagonName] ?? Types_wagon::where('name', $wagonName)->first()->id;

                foreach ($malfunctionList as $malfunctionName) {
                    Malfunction::firstOrCreate([
                        'name' => $malfunctionName,
                        'types_wagon_id' => $wagonId
                    ]);
                }
            }

            $this->command->info('Types wagons and malfunctions initialized successfully');

        } catch (\Exception $e) {
            $this->command->error('Error creating types wagons and malfunctions: ' . $e->getMessage());
        }
    }
}
